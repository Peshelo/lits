"use client";
import React, { useState } from 'react';
import { Form, Input, Checkbox, Button, Typography, notification } from 'antd';
import pb from '@/lib/connection';
import { useRouter } from "next/navigation";
import { GiCow } from 'react-icons/gi';

const { Title, Text } = Typography;

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { username, password } = values;
      // Authenticate using PocketBase
      await pb.collection('users').authWithPassword(username, password);
      
      // Get user role from authenticated user
      const userRole = pb.authStore.model?.role?.toUpperCase();
      
      notification.success({
        message: 'Authentication Successful',
        description: 'Accessing National Livestock System',
      });

      // Redirect based on user role
      switch(userRole) {
        case 'FARMER':
          router.push('/farmer');
          break;
        case 'VET':
          router.push('/veterinarian');
          break;
        case 'GOV':
          router.push('/gov');
          break;
        case 'INSUARANCE':
          router.push('/insuarance');
          break;
        case 'ADMIN':
          router.push('/admin');
          break;
        default:
          notification.warning({
            message: 'Unknown Role',
            description: 'Redirecting to default portal',
          });
          router.push('/dashboard');
      }

    } catch (error) {
      notification.error({
        message: 'Authentication Failed',
        description: error.message || 'Invalid credentials or network error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-6">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <GiCow className="text-5xl text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 text-center">
            National Livestock Traceability System
          </h1>
          <p className="text-gray-600 mt-2">Secure Government Portal</p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <Form
            layout="vertical"
            onFinish={onFinish}
            className="space-y-6"
          >
            <Form.Item
              name="username"
              label={<span className="text-gray-700 font-medium">Username</span>}
              rules={[{ required: true, message: 'Please enter your government-issued ID' }]}
            >
              <Input 
                size="large"
                placeholder="Government ID"
                className="rounded hover:border-green-500 focus:border-green-500"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-gray-700 font-medium">Password</span>}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password 
                size="large"
                placeholder="Secure passphrase"
                className="rounded hover:border-green-500 focus:border-green-500"
              />
            </Form.Item>

            <div className="flex justify-between items-center -mt-4">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="text-gray-600">Remember me</Checkbox>
              </Form.Item>
              <a 
                href="/auth/reset" 
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Forgot password?
              </a>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                className="bg-green-600 hover:bg-green-700 border-none font-medium h-11 rounded shadow-sm"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Need access?{' '}
              <a 
                href="/auth/register" 
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Request account
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            National Livestock Traceability System v1.0<br />
            © {new Date().getFullYear()} Government Livestock Department
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;