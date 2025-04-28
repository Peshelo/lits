"use client";
import React, { useState, useEffect } from "react";
import { 
  Table, Tag, Button, Card, Select, Modal, Form, 
  Input, Timeline, message, Spin, Alert, Space 
} from "antd";
import { PlusOutlined, EnvironmentOutlined } from "@ant-design/icons";
import pb from "@/lib/connection";
import dynamic from "next/dynamic";

const Map = dynamic(() => import('@/components/ui/map'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center"><Spin /></div>
});

const TransitManagement = () => {
  const [transits, setTransits] = useState([]);
  const [farms, setFarms] = useState([]);
  const [availableLivestock, setAvailableLivestock] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpoints, setSelectedCheckpoints] = useState([]);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [routeDistance, setRouteDistance] = useState(0);

  // Table columns
  const columns = [
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      sorter: (a, b) => a.purpose.localeCompare(b.purpose),
    },
    {
      title: 'Origin',
      key: 'from',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.expand?.from?.name}</div>
          <div className="text-xs text-gray-500">{record.expand?.from?.province}</div>
        </div>
      ),
    },
    {
      title: 'Destination',
      key: 'to',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.expand?.to?.name}</div>
          <div className="text-xs text-gray-500">{record.expand?.to?.province}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'preparing' ? 'blue' :
          status === 'in-transit' ? 'orange' :
          status === 'completed' ? 'green' : 'red'
        }>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Livestock',
      key: 'livestock',
      render: (_, record) => (
        <span>{record.livestock?.length || 0} animals</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EnvironmentOutlined />} 
            onClick={() => {
              setSelectedCheckpoints(JSON.parse(record.checkpoints || '[]'));
              setRouteModalVisible(true);
            }}
          >
            View Route
          </Button>
        </Space>
      ),
    },
  ];

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [farmsData, livestockData, transitData] = await Promise.all([
        pb.collection('farm').getFullList(),
        pb.collection('livestock').getFullList({
          filter: 'inTransit = false'
        }),
        pb.collection('in_transit').getFullList({
          expand: 'from,to,livestock'
        })
      ]);
      
      setFarms(farmsData);
      setAvailableLivestock(livestockData);
      setTransits(transitData);
    } catch (error) {
      message.error('Failed to fetch data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Distance calculation
  const calculateDistance = (points) => {
    const R = 6371;
    let total = 0;
    
    for(let i = 1; i < points.length; i++) {
      const [lat1, lon1] = points[i-1];
      const [lat2, lon2] = points[i];
      
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
        
      total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    return total.toFixed(2);
  };

  // Map click handler
  const handleMapClick = (coords) => {
    const newCheckpoints = [
      ...checkpoints,
      {
        lat: coords[0],
        lng: coords[1],
        timestamp: new Date().toISOString()
      }
    ];
    
    setCheckpoints(newCheckpoints);
    setRouteDistance(calculateDistance(newCheckpoints.map(p => [p.lat, p.lng])));
  };

  // Form submission
  const handleSubmit = async (values) => {
    if (checkpoints.length < 2) {
      message.error('Please plot at least 2 checkpoints');
      return;
    }

    try {
      // Update livestock status
      await Promise.all(values.livestock.map(id => 
        pb.collection('livestock').update(id, { inTransit: true })
      ));

      // Create transit record
      await pb.collection('in_transit').create({
        ...values,
        checkpoints: JSON.stringify(checkpoints),
        status: 'preparing',
        distance: routeDistance
      });


      await fetchData();
      message.success('Transit record created!');
      setIsModalVisible(false);
      form.resetFields();
      setCheckpoints([]);
      setRouteDistance(0);
    } catch (error) {
      message.error('Failed to create record: ' + error.message);
    }
  };

  // Timeline items
  const getTimelineItems = (checkpoints) => {
    console.log
    if (!checkpoints?.length) return [];
    
    return [
      {
        children: `Departure: ${new Date(checkpoints[0].timestamp).toLocaleString()}`
      },
      ...checkpoints.slice(1, -1).map((cp, i) => ({
        children: `Checkpoint ${i+1}: ${new Date(cp.timestamp).toLocaleString()}`
      })),
      {
        children: `Arrival: ${new Date(checkpoints[checkpoints.length-1].timestamp).toLocaleString()}`
      }
    ];
  };

  return (
    <div className="p-6">
      <Card
        title="Livestock Transportation"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            New Transit
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={transits}
          loading={loading}
          rowKey="id"
          expandable={{
            expandedRowRender: record => (
              <div className="p-4 bg-gray-50 rounded-lg">
                {/* <p>{t(record.checkpoints)}</p> */}
                <Timeline items={getTimelineItems(record.checkpoints || '[]')} />
                <div className="mt-4">
                  <div className="font-medium">Total Distance:</div>
                  <div>{record.distance} km</div>
                </div>
              </div>
            )
          }}
        />
      </Card>

      {/* New Transit Modal */}
      <Modal
        title="New Transit Plan"
        width={800}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Purpose"
            name="purpose"
            rules={[{ required: true, message: 'Please enter purpose' }]}
          >
            <Input placeholder="Transportation purpose" />
          </Form.Item>

          <Form.Item
            label="Origin Farm"
            name="from"
            rules={[{ required: true, message: 'Please select origin farm' }]}
          >
            <Select showSearch optionFilterProp="label">
              {farms.map(farm => (
                <Select.Option 
                  key={farm.id} 
                  value={farm.id}
                  label={`${farm.name} (${farm.province})`}
                >
                  {farm.name} - {farm.province}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Destination Farm"
            name="to"
            rules={[{ required: true, message: 'Please select destination farm' }]}
          >
            <Select showSearch optionFilterProp="label">
              {farms.map(farm => (
                <Select.Option 
                  key={farm.id} 
                  value={farm.id}
                  label={`${farm.name} (${farm.province})`}
                >
                  {farm.name} - {farm.province}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Select Livestock"
            name="livestock"
            rules={[{ required: true, message: 'Please select livestock' }]}
          >
            <Select
              mode="multiple"
              optionFilterProp="label"
              placeholder="Select animals for transport"
              options={availableLivestock.map(animal => ({
                label: `${animal.name} (${animal.RFID_Tag})`,
                value: animal.id
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Plot Route"
            required
            help="Click on the map to add checkpoints"
          >
            <div className="border rounded-lg overflow-hidden">
              <Map 
                markers={checkpoints}
                polyline={checkpoints}
                onClick={handleMapClick}
              />
            </div>
            <Alert
              className="mt-4"
              message={`Total Distance: ${routeDistance} km`}
              type="info"
              showIcon
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Transit Plan
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Route View Modal */}
      <Modal
        title="Transportation Route"
        width={800}
        open={routeModalVisible}
        onCancel={() => setRouteModalVisible(false)}
        footer={null}
      >
        <div className="h-[500px]">
          <Map 
            markers={selectedCheckpoints}
            polyline={selectedCheckpoints}
          />
          <Alert
            className="mt-4"
            message={`Total Distance: ${selectedCheckpoints.length > 0 
              ? calculateDistance(selectedCheckpoints.map(p => [p.lat, p.lng]))
              : 0} km`}
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
};

export default TransitManagement;