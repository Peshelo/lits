"use client";
import React, { useState, useEffect } from "react";
import { Form, Input, Select, DatePicker, Button, Upload, message, Card, Divider, notification } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import pb from "@/lib/connection";

const { Option } = Select;
const { TextArea } = Input;

// Breed data by livestock type
const BREEDS_BY_TYPE = {
  Cattle: [
    "Angus",
    "Hereford",
    "Brahman",
    "Simmental",
    "Charolais",
    "Limousin",
    "Holstein",
    "Jersey",
    "Other Cattle Breed"
  ],
  Goat: [
    "Boer",
    "Nubian",
    "Alpine",
    "Saanen",
    "Toggenburg",
    "LaMancha",
    "Other Goat Breed"
  ],
  Pig: [
    "Yorkshire",
    "Duroc",
    "Hampshire",
    "Berkshire",
    "Pietrain",
    "Other Pig Breed"
  ],
  Poultry: [
    "Broiler",
    "Layer",
    "Rhode Island Red",
    "Plymouth Rock",
    "Leghorn",
    "Other Poultry Breed"
  ],
  Other: ["Other Breed"]
};

export default function AddLivestockForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [availableBreeds, setAvailableBreeds] = useState([]);
  const [livestockType, setLivestockType] = useState(null);
  const [femaleLivestock, setFemaleLivestock] = useState([]);
  const [maleLivestock, setMaleLivestock] = useState([]);
  const [fetchingParents, setFetchingParents] = useState(false);

  // Fetch female and male livestock for parent selection
  useEffect(() => {
    const fetchParents = async () => {
      try {
        setFetchingParents(true);
        // Fetch female livestock (for mother selection)
        const femaleRecords = await pb.collection('livestock').getFullList({
          filter: 'gender = "Female"',
          expand: 'owner_id'
        });
        setFemaleLivestock(femaleRecords);

        // Fetch male livestock (for father selection)
        const maleRecords = await pb.collection('livestock').getFullList({
          filter: 'gender = "Male"',
          expand: 'owner_id'
        });
        setMaleLivestock(maleRecords);
      } catch (error) {
        console.error('Error fetching parent livestock:', error);
      } finally {
        setFetchingParents(false);
      }
    };
    fetchParents();
  }, []);

  // Update available breeds when livestock type changes
  useEffect(() => {
    if (livestockType && BREEDS_BY_TYPE[livestockType]) {
      setAvailableBreeds(BREEDS_BY_TYPE[livestockType]);
      form.setFieldsValue({ breed: undefined }); // Reset breed selection
    } else {
      setAvailableBreeds([]);
    }
  }, [livestockType, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Append all form values
      Object.keys(values).forEach(key => {
        if (key === 'dateOfBirth') {
          formData.append(key, values[key].format('YYYY-MM-DD'));
        } else if (key !== 'image') {
          formData.append(key, values[key]);
        }
      });

      // Append image file if exists
      if (values.image && values.image[0]?.originFileObj) {
        formData.append('image', values.image[0].originFileObj);
      }

      // Add owner_id
      formData.append('owner_id', pb.authStore.model?.id || "");

      // Create record with form data
      const record = await pb.collection('livestock').create(formData);
      
      notification.success({
        message: "Success",
        description: "Livestock added successfully!",
      });
      form.resetFields();
      setFileList([]);
      setLivestockType(null);
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
      return Upload.LIST_IGNORE;
    }
    return false; // Prevent automatic upload
  };

  const handleTypeChange = (value) => {
    setLivestockType(value);
  };

  const handleReasonChange = (value) => {
    // Reset parent fields when reason changes
    if (value !== 'Birth') {
      form.setFieldsValue({ mother: undefined, father: undefined });
    }
  };

  return (
    <Card title="Register New Livestock" className="w-full mx-auto shadow-lg">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ healthStatus: "Healthy" }}
      >
        {/* Registration Information Section */}
        <Divider orientation="left" orientationMargin={0}>Registration Information</Divider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label="Reason for Registration"
            name="reasonForRegister"
            rules={[{ required: true, message: "Please select registration reason" }]}
          >
            <Select 
              size="large" 
              placeholder="Select reason"
              onChange={handleReasonChange}
            >
              <Option value="Birth">Birth</Option>
              <Option value="Purchased">Purchased</Option>
              <Option value="Gift">Gift</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
        </div>

        {/* Basic Information Section */}
        <Divider orientation="left" orientationMargin={0}>Basic Information</Divider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter the livestock name" }]}
          >
            <Input size="large" placeholder="Livestock name" />
          </Form.Item>

          <Form.Item
            label="Type"
            name="typeOfLivestock"
            rules={[{ required: true, message: "Please select the type" }]}
          >
            <Select 
              size="large" 
              placeholder="Select type"
              onChange={handleTypeChange}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {Object.keys(BREEDS_BY_TYPE).map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Breed"
            name="breed"
            rules={[{ required: true, message: "Please select the breed" }]}
          >
            <Select 
              size="large" 
              placeholder="Select breed"
              disabled={!livestockType}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {availableBreeds.map(breed => (
                <Option key={breed} value={breed}>{breed}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Color" name="color">
            <Input size="large" placeholder="Color" />
          </Form.Item>
        </div>

        {/* Parent Information Section (Conditional) */}
        <Form.Item noStyle shouldUpdate>
          {({ getFieldValue }) => (
            getFieldValue('reasonForRegister') === 'Birth' ? (
              <>
                <Divider orientation="left" orientationMargin={0}>Parent Information</Divider>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Mother"
                    name="mother"
                    rules={[{ required: true, message: "Please select mother" }]}
                  >
                    <Select
                      size="large"
                      placeholder="Select mother"
                      loading={fetchingParents}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {femaleLivestock.map(animal => (
                        <Option key={animal.id} value={animal.id}>
                          {animal.name} ({animal.RFID_Tag || 'No RFID'})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Father"
                    name="father"
                    rules={[{ required: true, message: "Please select father" }]}
                  >
                    <Select
                      size="large"
                      placeholder="Select father"
                      loading={fetchingParents}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {maleLivestock.map(animal => (
                        <Option key={animal.id} value={animal.id}>
                          {animal.name} ({animal.RFID_Tag || 'No RFID'})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
              </>
            ) : null
          )}
        </Form.Item>

        {/* Identification Section */}
        <Divider orientation="left" orientationMargin={0}>Identification</Divider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label="RFID Tag"
            name="RFID_Tag"
            rules={[{ required: true, message: "Please enter the RFID Tag" }]}
          >
            <Input size="large" placeholder="RFID Tag number" />
          </Form.Item>

          <Form.Item
            label="Image"
            name="image"
            valuePropName="fileList"
            getValueFromEvent={(e) => e.fileList}
          >
            <Upload
              beforeUpload={beforeUpload}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              listType="picture"
              accept="image/*"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />} size="large">
                Upload Livestock Photo
              </Button>
            </Upload>
          </Form.Item>
        </div>

        {/* Physical Attributes Section */}
        <Divider orientation="left" orientationMargin={0}>Physical Attributes</Divider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label="Gender"
            name="gender"
            rules={[{ required: true, message: "Please select gender" }]}
          >
            <Select size="large" placeholder="Select gender">
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Weight (kg)"
            name="weight"
            rules={[{ required: true, message: "Please enter weight" }]}
          >
            <Input size="large" placeholder="Weight in kilograms" type="number" />
          </Form.Item>

          <Form.Item
            label="Date of Birth"
            name="dateOfBirth"
            rules={[{ required: true, message: "Please select the date of birth" }]}
          >
            <DatePicker 
              size="large" 
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </div>

        {/* Health Information Section */}
        <Divider orientation="left" orientationMargin={0}>Health Information</Divider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item label="Health Status" name="healthStatus">
            <Select size="large" placeholder="Select health status">
              <Option value="Healthy">Healthy</Option>
              <Option value="Sick">Sick</Option>
              <Option value="Under Treatment">Under Treatment</Option>
            </Select>
          </Form.Item>
        </div>

        {/* Additional Information Section */}
        <Divider orientation="left" orientationMargin={0}>Additional Information</Divider>
        <Form.Item label="Notes" name="notes">
          <TextArea rows={4} placeholder="Any additional information about this livestock" />
        </Form.Item>

        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="w-full bg-green-600 hover:bg-green-700 h-12"
          >
            {loading ? "Registering Livestock..." : "Register Livestock"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}