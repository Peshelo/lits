"use client";
import React, { useState, useEffect } from "react";
import { 
  UserOutlined, 
  PlusOutlined, 
  EyeOutlined, 
  ScanOutlined,  
  FilePdfOutlined, 
  EditOutlined,
  ShareAltOutlined 
} from "@ant-design/icons";
import { 
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
  Tree,
  Table
} from "antd";
import pb from "@/lib/connection";
import { GiCow } from "react-icons/gi";
import dayjs from "dayjs";
import { useParams } from "next/navigation";

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

const LivestockDetailsPage = () => {
  const { id } = useParams();
  const [livestockData, setLivestockData] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [activities, setActivities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [certificateVisible, setCertificateVisible] = useState(false);
  const [lineageVisible, setLineageVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingLineage, setLoadingLineage] = useState(false);
  const [lineageData, setLineageData] = useState([]);

  // Fetch all required data for the specific livestock
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch livestock details
        const livestockRecord = await pb.collection('livestock').getOne(id, {
          expand: 'owner_id,mother,father'
        });
        setLivestockData(livestockRecord);

        // Fetch related medical records
        const medicalRecords = await pb.collection('Medical_Records').getFullList({
          filter: `livestock_id = "${id}"`,
          expand: 'veterinarian_id'
        });
        setMedicalRecords(medicalRecords);

        // Fetch related activities
        const activityRecords = await pb.collection('Livestock_Activities').getFullList({
          filter: `livestock_id = "${id}"`
        });
        setActivities(activityRecords);

        // Fetch related documents
        const documentRecords = await pb.collection('Livestock_Documents').getFullList({
          filter: `livestock_id = "${id}"`
        });
        setDocuments(documentRecords);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

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

  const showLineage = () => {
    if (livestockData) {
      fetchLineageData(livestockData.id);
      setLineageVisible(true);
    }
  };

  const handleScan = async (values) => {
    try {
      const record = await pb.collection('livestock').getFirstListItem(`RFID_Tag="${values.tag}"`);
      // Redirect to the scanned livestock's page
      window.location.href = `/livestock/${record.id}`;
    } catch (error) {
      Modal.error({
        title: 'Livestock Not Found',
        content: 'No animal found with this RFID tag',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!livestockData) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold">Livestock Not Found</h2>
            <p className="text-gray-500 mt-2">The requested livestock record does not exist.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card
        title={`Livestock Details - ${livestockData.name || livestockData.RFID_Tag}`}
        extra={
          <Space>
            <Button
              icon={<ScanOutlined />}
              onClick={() => setScanModalVisible(true)}
            >
              Scan RFID
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => setCertificateVisible(true)}
            >
              Certificate
            </Button>
            <Button
              icon={<ShareAltOutlined />}
              onClick={showLineage}
            >
              Lineage
            </Button>
          </Space>
        }
      >
        <div className="max-w-7xl mx-auto">
          {/* Basic Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="col-span-1">
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                <div className="aspect-square bg-white rounded border flex items-center justify-center">
                  {livestockData.image ? (
                    <Image
                      src={pb.getFileUrl(livestockData, livestockData.image)}
                      alt={livestockData.name}
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
                        <p className="font-medium">{livestockData.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">RFID Tag</p>
                        <p className="font-mono font-medium">{livestockData.RFID_Tag}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Internal ID</p>
                        <p className="font-mono text-sm">{livestockData.id}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Characteristics</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Breed</p>
                        <p className="font-medium">{livestockData.breed || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-medium">{livestockData.typeOfLivestock || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Color</p>
                        <p className="font-medium">{livestockData.color || '—'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Vital Statistics</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Date of Birth</p>
                        <p className="font-medium">
                          {livestockData.dateOfBirth ? 
                            dayjs(livestockData.dateOfBirth).format('MMMM D, YYYY') : 
                            '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="font-medium">{calculateAge(livestockData.dateOfBirth)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Weight</p>
                        <p className="font-medium">
                          {livestockData.weight ? `${livestockData.weight} kg` : '—'}
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
                          {livestockData.expand?.mother?.name || '—'}
                          {livestockData.expand?.mother?.RFID_Tag && (
                            <span className="text-gray-500 ml-2">({livestockData.expand.mother.RFID_Tag})</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Father</p>
                        <p className="font-medium">
                          {livestockData.expand?.father?.name || '—'}
                          {livestockData.expand?.father?.RFID_Tag && (
                            <span className="text-gray-500 ml-2">({livestockData.expand.father.RFID_Tag})</span>
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
                  dataSource={medicalRecords}
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
                          {livestockData.expand?.owner_id?.name || livestockData.owner_id}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Registered since {dayjs(livestockData.created).format('MMMM D, YYYY')}
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

      {/* Genetic Lineage Modal */}
      <Modal
        title={`Genetic Lineage - ${livestockData?.name || 'Unknown'}`}
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
                      window.location.href = `/livestock/${nodeData.livestock.id}`;
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
        <div className="p-4 border rounded-lg">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">Livestock Health Certificate</h2>
            <p className="text-gray-500">Issued on {dayjs().format('MMMM D, YYYY')}</p>
          </div>

          <Row gutter={16} className="mb-4">
            <Col span={12}>
              <Descriptions column={1}>
                <Descriptions.Item label="RFID Tag">{livestockData.RFID_Tag}</Descriptions.Item>
                <Descriptions.Item label="Name">{livestockData.name}</Descriptions.Item>
                <Descriptions.Item label="Breed">{livestockData.breed}</Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Descriptions column={1}>
                <Descriptions.Item label="Health Status">
                  <Tag color={livestockData.healthStatus === 'Healthy' ? 'green' : 'red'}>
                    {livestockData.healthStatus}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Owner">
                  {livestockData.expand?.owner_id?.name || livestockData.owner_id}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

          <div className="text-center my-6">
            <QRCode
              value={`${window.location.origin}/verify-certificate?livestockId=${livestockData.id}`}
              size={200}
            />
            <p className="mt-2 text-sm text-gray-500">Scan to verify authenticity</p>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>This certificate confirms that the above livestock has undergone health inspection</p>
            <p>Issued by: National Livestock Traceability System</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LivestockDetailsPage;