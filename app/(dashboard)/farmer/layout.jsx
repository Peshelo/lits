"use client";
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  DashboardOutlined,
  FileOutlined,
  TeamOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ScanOutlined,
  CarOutlined,
  SafetyOutlined,
  InsuranceOutlined,
  MenuOutlined,
  PlusOutlined,
  EyeOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Layout, Menu, theme, Button } from 'antd';

const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label: children ? label : <Link href={`/${key}`}>{label}</Link>,
  };
}

const items = [
  getItem('Dashboard', './farmer', <DashboardOutlined />),
  getItem('Regional Health', './farmer/regional-health', <MedicineBoxOutlined />),
  getItem('Livestock', './farmer/livestock', <TeamOutlined />, [
    getItem('View Livestock', './farmer/livestock', <EyeOutlined />),
    getItem('Add New Livestock', './farmer/livestock/create-new', <PlusOutlined />),
    getItem('Scan Livestock', './farmer/livestock/scan', <ScanOutlined />),
  ]),
  getItem('Medical Records', './farmer/livestock/medical-records', <FileOutlined />,[
    getItem('View Medical Records', './farmer/livestock/medical-records', <EyeOutlined />),
    getItem('Add Medical Records', './farmer/livestock/medical-records/create-new', <PlusOutlined />),

  ]),
  getItem('Livestock in Transit', './farmer/livestock/intransit', <CarOutlined />, [
    getItem('View Livestock in Transit', './farmer/livestock/intransit', <EyeOutlined />),
    getItem('Request Ownership Transfer', './farmer/livestock/intransit/transfer', <SyncOutlined />),
  ]),
  getItem('Insurance', './farmer/insurance', <InsuranceOutlined />, [
    getItem('View Insurance', './farmer/insurance/view', <EyeOutlined />),
    getItem('Validate Insurance', './farmer/insurance/validate', <CheckCircleOutlined />),
    getItem('Request Insurance', './farmer/insurance/request', <SafetyOutlined />),
  ]),
];

const App = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const pathname = usePathname();
  const currentPath = pathname.split('/')[1]; // Get the current path to highlight active link

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={240}
        style={{ background: '#001529' }} // Dark sidebar for professional look
      >
        <div className="logo" style={{ padding: '16px', textAlign: 'center' }}>
          <img
            src="/logo.png" // Replace with your logo
            alt="logo"
            style={{ maxWidth: '100%' }}
          />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPath]} // Highlight active link
          items={items}
          style={{ borderRadius: '5px' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >  
       
          <div className='text-black text-2xl flex flex-row items-center'>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: '40px', height: '40px' }}
          />
          <h1 className='ml-10 font-semibold'>FARMER PORTAL</h1>

          </div>
         

          <div>
            {/* Add additional header content here, if needed */}
          </div>
          <Button
            type="text"
            icon={<UserOutlined />}
            style={{ fontSize: '16px', width: '40px', height: '40px' }}
          />
        </Header>
        <Content
          style={{
            margin: '5px',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            padding: '20px',
            backgroundColor: '#f0f2f5',
          }}
        >
          {/* <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          </Breadcrumb> */}
          {children}
        </Content>
        <Footer
          style={{
            textAlign: 'center',
            borderRadius: borderRadiusLG,
          }}
          className="text-gray-400"
        >
          National Livestock Traceability System ©{new Date().getFullYear()} Created by Peshel
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;