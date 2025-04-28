"use client";
import React, { useState, useEffect } from "react";
import { 
  UserOutlined, 
  SearchOutlined, 
  PlusOutlined, 
  EyeOutlined, 
  ScanOutlined,  
  FilePdfOutlined, 
  EditOutlined,
  ShareAltOutlined 
} from "@ant-design/icons";
import { 
  Table, 
  Input, 
  Button, 
  Drawer, 
  Tag, 
  Space, 
  Image, 
  Spin, 
  Modal, 
  Form, 
  Card, 
  Row, 
  Col, 
  Descriptions, 
  Select, 
  QRCode, 
  Timeline, 
  Tabs, 
  Divider,
  Tree
} from "antd";
import { useRouter } from "next/navigation";
import pb from "@/lib/connection";
import { GiCow } from "react-icons/gi";
import dayjs from "dayjs";

const { Search } = Input;
const { TabPane } = Tabs;

const tempActivities = [
  {
    id: 'act1',
    type: 'Health Check',
    description: 'Routine veterinary examination completed',
    date: '2023-06-15',
    performedBy: 'Dr. James Wilson'
  },
  {
    id: 'act2',
    type: 'Vaccination',
    description: 'Administered annual vaccination (Clostridial)',
    date: '2023-05-20',
    performedBy: 'Dr. Sarah Johnson'
  },
  {
    id: 'act3',
    type: 'Location Change',
    description: 'Transferred to pasture field B3',
    date: '2023-04-10',
    performedBy: 'Farmhand Miguel'
  },
  {
    id: 'act4',
    type: 'Weight Measurement',
    description: 'Recorded weight: 450kg (+15kg from last measurement)',
    date: '2023-03-28',
    performedBy: 'Farmhand Anna'
  },
  {
    id: 'act5',
    type: 'Breeding',
    description: 'Successfully bred with bull #AG-782',
    date: '2023-02-15',
    performedBy: 'Dr. James Wilson'
  }
];

const ViewLivestockPage = () => {
  const router = useRouter();
  const [livestockData, setLivestockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [activities, setActivities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedLivestock, setSelectedLivestock] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [certificateVisible, setCertificateVisible] = useState(false);
  const [lineageVisible, setLineageVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingLineage, setLoadingLineage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [healthFilter, setHealthFilter] = useState("all");
  const [lineageData, setLineageData] = useState([]);

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const livestockRecords = await pb.collection('livestock').getFullList({
          sort: '-created',
          expand: 'owner_id,mother,father'
        });
        setLivestockData(livestockRecords);
        setFilteredData(livestockRecords);

        const medicalRecords = await pb.collection('Medical_Records').getFullList({
          expand: 'livestock_id,veterinarian_id'
        });
        setMedicalRecords(medicalRecords);

        const activityRecords = await pb.collection('Livestock_Activities').getFullList();
        setActivities(activityRecords);

        const documentRecords = await pb.collection('Livestock_Documents').getFullList();
        setDocuments(documentRecords);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter and search handler
  useEffect(() => {
    let filtered = livestockData.filter(item => {
      const matchesSearch = Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesHealth = healthFilter === 'all' || item.healthStatus === healthFilter;
      return matchesSearch && matchesHealth;
    });
    setFilteredData(filtered);
  }, [searchTerm, healthFilter, livestockData]);

  const calculateAge = (dob) => {
    if (!dob) return 'Unknown';
    const birthDate = new Date(dob);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + ' years';
  };

  const fetchLineageData = async (livestockId, depth = 3) => {
    setLoadingLineage(true);
    try {
      const livestock = await pb.collection('livestock').getOne(livestockId, {
        expand: 'mother,father,mother.mother,mother.father,father.mother,father.father'
      });
      
      const buildTree = async (animal, currentDepth) => {
        if (!animal || currentDepth <= 0) return null;
        
        const node = {
          title: (
            <div className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
              {animal.image && (
                <Image
                  src={pb.getFileUrl(animal, animal.image)}
                  width={24}
                  height={24}
                  className="rounded-full"
                  preview={false}
                  alt="Livestock"
                />
              )}
              <span>{animal.name || 'Unnamed'} ({animal.RFID_Tag})</span>
            </div>
          ),
          key: animal.id,
          livestock: animal,
          children: []
        };

        if (animal.mother) {
          const mother = await pb.collection('livestock').getOne(animal.mother, {
            expand: 'mother,father'
          });
          node.children.push(await buildTree(mother, currentDepth - 1));
        }

        if (animal.father) {
          const father = await pb.collection('livestock').getOne(animal.father, {
            expand: 'mother,father'
          });
          node.children.push(await buildTree(father, currentDepth - 1));
        }

        node.children = node.children.filter(child => child !== null);
        return node;
      };

      const treeData = await buildTree(livestock, depth);
      setLineageData(treeData ? [treeData] : []);
    } catch (error) {
      console.error('Error fetching lineage:', error);
      setLineageData([]);
    } finally {
      setLoadingLineage(false);
    }
  };

  const showDrawer = (record) => {
    setSelectedLivestock(record);
    setDrawerVisible(true);
  };

  const showLineage = (record) => {
    setSelectedLivestock(record);
    fetchLineageData(record.id);
    setLineageVisible(true);
  };

  const handleScan = async (values) => {
    try {
      const record = await pb.collection('livestock').getFirstListItem(`RFID_Tag="${values.tag}"`);
      showDrawer(record);
      setScanModalVisible(false);
    } catch (error) {
      Modal.error({
        title: 'Livestock Not Found',
        content: 'No animal found with this RFID tag',
      });
    }
  };

  const handleGenerateCertificate = (record) => {
    setSelectedLivestock(record);
    setCertificateVisible(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id.localeCompare(b.id),
      render: (id) => <Tag color="blue">{id.substring(0, 6)}...</Tag>,
    },
    {
      title: 'RFID Tag',
      dataIndex: 'RFID_Tag',
      key: 'RFID_Tag',
      sorter: (a, b) => a.RFID_Tag.localeCompare(b.RFID_Tag),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          {record.image && (
            <Image
              src={pb.getFileUrl(record, record.image)}
              width={40}
              height={40}
              style={{ objectFit: 'cover' }}
              className="rounded-full"
              preview={false}
              alt="Livestock"
            />
          )}
          {text || 'Unnamed'}
        </div>
      ),
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender) => gender ? (
        <Tag color={gender === 'Male' ? 'blue' : 'pink'}>{gender}</Tag>
      ) : 'Not Available',
    },
    {
      title: 'Breed',
      dataIndex: 'breed',
      key: 'breed',
      render: (breed) => breed ? <Tag>{breed}</Tag> : 'Not Available',
    },
    {
      title: 'Type',
      dataIndex: 'typeOfLivestock',
      key: 'typeOfLivestock',
      render: (type) => type || 'Not Available',
    },
    {
      title: 'Health Status',
      dataIndex: 'healthStatus',
      key: 'healthStatus',
      render: (status) => (
        <Tag color={status === 'Healthy' ? 'green' : 'red'}>
          {status || 'Unknown'}
        </Tag>
      ),
      filters: [
        { text: 'Healthy', value: 'Healthy' },
        { text: 'Sick', value: 'Sick' },
      ],
      onFilter: (value, record) => record.healthStatus === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => showDrawer(record)}
          >
            View
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleGenerateCertificate(record)}
          >
            Certificate
          </Button>
          <Button
            icon={<ShareAltOutlined />}
            onClick={() => showLineage(record)}
          >
            Lineage
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card
        title="Livestock Management"
        extra={
          <Space>
            <Button
              icon={<ScanOutlined />}
              onClick={() => setScanModalVisible(true)}
            >
              Scan RFID
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/farmer/livestock/create-new')}
            >
              Add Livestock
            </Button>
          </Space>
        }
      >
        <Row gutter={16} className="mb-4">
          <Col span={12}>
            <Search
              placeholder="Search livestock..."
              prefix={<SearchOutlined />}
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </Col>
          <Col span={12}>
            <Select
              defaultValue="all"
              className="w-full"
              onChange={(value) => setHealthFilter(value)}
            >
              <Option value="all">All Health Statuses</Option>
              <Option value="Healthy">Healthy</Option>
              <Option value="Sick">Sick</Option>
            </Select>
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        </Spin>
      </Card>

      {/* Scan Modal */}
      <Modal
        title="Scan RFID Tag"
        open={scanModalVisible}
        onCancel={() => setScanModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleScan}>
          <Form.Item
            label="RFID Tag"
            name="tag"
            rules={[{ required: true, message: 'Please scan or enter RFID tag' }]}
          >
            <Input placeholder="Scan tag or enter manually" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Search
          </Button>
        </Form>
      </Modal>

      {/* Full-width Report Drawer */}
      <Drawer
        title={null}
        placement="right"
        closable={true}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width="100%"
        className="report-drawer"
        extra={
          <Space>
            <Button icon={<FilePdfOutlined />}>Export PDF</Button>
            <Button type="primary" icon={<EditOutlined />}>
              Edit Record
            </Button>
          </Space>
        }
      >
        {selectedLivestock && (
          <div className="max-w-7xl mx-auto p-6">
            {/* Report Header */}
            <div className="border-b pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Livestock Identification Report
                  </h1>
                  <p className="text-gray-500">
                    National Livestock Traceability System • {dayjs().format('MMMM D, YYYY')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{selectedLivestock.RFID_Tag}</div>
                  <Tag color="blue">Active Record</Tag>
                </div>
              </div>
            </div>

            {/* Basic Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="col-span-1">
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <div className="aspect-square bg-white rounded border flex items-center justify-center">
                    {selectedLivestock.image ? (
                      <Image
                        src={pb.getFileUrl(selectedLivestock, selectedLivestock.image)}
                        alt={selectedLivestock.name}
                        className="w-full h-full object-contain"
                        width={400}
                        height={400}
                      />
                    ) : (
                      <GiCow className="text-6xl text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="bg-white rounded-lg border p-6 h-full">
                  <h2 className="text-xl font-semibold mb-4">Animal Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Identification</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="font-medium">{selectedLivestock.name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">RFID Tag</p>
                          <p className="font-mono font-medium">{selectedLivestock.RFID_Tag}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Internal ID</p>
                          <p className="font-mono text-sm">{selectedLivestock.id}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Characteristics</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Breed</p>
                          <p className="font-medium">{selectedLivestock.breed || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="font-medium">{selectedLivestock.typeOfLivestock || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Color</p>
                          <p className="font-medium">{selectedLivestock.color || '—'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Vital Statistics</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="font-medium">
                            {selectedLivestock.dateOfBirth ? 
                              dayjs(selectedLivestock.dateOfBirth).format('MMMM D, YYYY') : 
                              '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Age</p>
                          <p className="font-medium">{calculateAge(selectedLivestock.dateOfBirth)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="font-medium">
                            {selectedLivestock.weight ? `${selectedLivestock.weight} kg` : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Genetic Lineage</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Mother</p>
                          <p className="font-medium">
                            {selectedLivestock.expand?.mother?.name || '—'}
                            {selectedLivestock.expand?.mother?.RFID_Tag && (
                              <span className="text-gray-500 ml-2">({selectedLivestock.expand.mother.RFID_Tag})</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Father</p>
                          <p className="font-medium">
                            {selectedLivestock.expand?.father?.name || '—'}
                            {selectedLivestock.expand?.father?.RFID_Tag && (
                              <span className="text-gray-500 ml-2">({selectedLivestock.expand.father.RFID_Tag})</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultActiveKey="1" className="report-tabs">
              <TabPane tab="Medical History" key="1">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Medical Records</h2>
                    <Button type="primary" icon={<PlusOutlined />}>
                      Add Medical Record
                    </Button>
                  </div>
                  
                  <Table
                    dataSource={medicalRecords.filter(r => r.livestock_id === selectedLivestock.id)}
                    columns={[
                      {
                        title: 'Date',
                        dataIndex: 'examination_date',
                        render: date => dayjs(date).format('MMM D, YYYY'),
                        sorter: (a, b) => new Date(a.examination_date) - new Date(b.examination_date),
                        width: 120,
                      },
                      {
                        title: 'Procedure',
                        dataIndex: 'treatment_details',
                        render: text => text || '—',
                      },
                      {
                        title: 'Veterinarian',
                        dataIndex: ['expand', 'veterinarian_id', 'name'],
                        render: text => text || '—',
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        render: status => (
                          <Tag color={status === 'Completed' ? 'green' : 'orange'}>
                            {status}
                          </Tag>
                        ),
                        width: 120,
                      },
                      {
                        title: 'Actions',
                        render: (_, record) => (
                          <Button size="small">View Details</Button>
                        ),
                        width: 120,
                      },
                    ]}
                    pagination={{ pageSize: 5 }}
                    size="middle"
                  />
                </div>
              </TabPane>
              
              <TabPane tab="Activity Log" key="2">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Activity History</h2>
                    <Button type="primary" icon={<PlusOutlined />}>
                      Log Activity
                    </Button>
                  </div>
                  
                  <Timeline mode="left" className="activity-timeline">
                    {tempActivities.map(activity => (
                      <Timeline.Item 
                        key={activity.id}
                        label={
                          <div className="text-sm text-gray-500">
                            {dayjs(activity.date).format('MMM D, YYYY')}
                          </div>
                        }
                      >
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{activity.type}</h3>
                              <p className="text-gray-600">{activity.description}</p>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <UserOutlined />
                              {activity.performedBy}
                            </div>
                          </div>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              </TabPane>
              
              <TabPane tab="Ownership" key="3">
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-6">Ownership History</h2>
                  
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="font-medium mb-2">Current Owner</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserOutlined className="text-xl text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedLivestock.expand?.owner_id?.name || selectedLivestock.owner_id}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Registered since {dayjs(selectedLivestock.created).format('MMMM D, YYYY')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Transfer History</h3>
                      <Table
                        dataSource={[]}
                        columns={[
                          {
                            title: 'Date',
                            dataIndex: 'date',
                            key: 'date',
                            width: 120,
                          },
                          {
                            title: 'From',
                            dataIndex: 'from',
                            key: 'from',
                          },
                          {
                            title: 'To',
                            dataIndex: 'to',
                            key: 'to',
                          },
                          {
                            title: 'Reason',
                            dataIndex: 'reason',
                            key: 'reason',
                          },
                        ]}
                        locale={{
                          emptyText: 'No ownership transfers recorded'
                        }}
                        pagination={false}
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </TabPane>
            </Tabs>
            
            {/* Report Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
              <p>National Livestock Traceability System • Official Report</p>
              <p className="mt-1">Generated on {dayjs().format('MMMM D, YYYY h:mm A')}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Genetic Lineage Modal */}
      <Modal
        title={`Genetic Lineage - ${selectedLivestock?.name || 'Unknown'}`}
        open={lineageVisible}
        onCancel={() => setLineageVisible(false)}
        width={800}
        footer={null}
      >
        <Spin spinning={loadingLineage}>
          {lineageData.length > 0 ? (
            <div className="p-4">
              <Tree
                showLine
                treeData={lineageData}
                defaultExpandAll
                titleRender={(nodeData) => (
                  <div 
                    className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                    onClick={() => {
                      setSelectedLivestock(nodeData.livestock);
                      setDrawerVisible(true);
                      setLineageVisible(false);
                    }}
                  >
                    {nodeData.title}
                  </div>
                )}
              />
              <div className="mt-4 text-sm text-gray-500">
                <p>Click on any animal to view their details</p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p>No lineage information available for this animal</p>
            </div>
          )}
        </Spin>
      </Modal>

      {/* Health Certificate Modal */}
      <Modal
        title="Health Certificate"
        open={certificateVisible}
        onCancel={() => setCertificateVisible(false)}
        footer={null}
        width={800}
      >
        {selectedLivestock && (
          <div className="p-4 border rounded-lg">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">Livestock Health Certificate</h2>
              <p className="text-gray-500">Issued on {dayjs().format('MMMM D, YYYY')}</p>
            </div>

            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Descriptions column={1}>
                  <Descriptions.Item label="RFID Tag">{selectedLivestock.RFID_Tag}</Descriptions.Item>
                  <Descriptions.Item label="Name">{selectedLivestock.name}</Descriptions.Item>
                  <Descriptions.Item label="Breed">{selectedLivestock.breed}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1}>
                  <Descriptions.Item label="Health Status">
                    <Tag color={selectedLivestock.healthStatus === 'Healthy' ? 'green' : 'red'}>
                      {selectedLivestock.healthStatus}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Owner">
                    {selectedLivestock.expand?.owner_id?.name || selectedLivestock.owner_id}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <div className="text-center my-6">
              <QRCode
                value={`${window.location.origin}/verify-certificate?livestockId=${selectedLivestock.id}`}
                size={200}
              />
              <p className="mt-2 text-sm text-gray-500">Scan to verify authenticity</p>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>This certificate confirms that the above livestock has undergone health inspection</p>
              <p>Issued by: National Livestock Traceability System</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewLivestockPage;