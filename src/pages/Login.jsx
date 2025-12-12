import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      // ✅ email yuboriladi (username emas!)
      const { data } = await API.post("/auth/login", {
        email: values.email, // Backend email kutadi
        password: values.password,
      });

      // ✅ Token va user ma'lumotlarini saqlash
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      message.success("Kirish muvaffaqiyatli! 🎉");

      // ✅ Dashboard ga o'tish (replace: true - orqaga qaytmaslik uchun)
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (err) {
      console.error("❌ Login xatosi:", err);
      message.error(
        err.response?.data?.message || "Login yoki parol noto'g'ri ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: 360,
          borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: "linear-gradient(135deg,#36cfc9,#096dd9)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 auto 12px",
              fontSize: 28,
              color: "#fff",
              fontWeight: "bold",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
          >
            🍽️
          </div>
          <Title level={3} style={{ marginBottom: 0 }}>
            Roxat
          </Title>
        </div>

        <Form
          name="login"
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email kiriting" },
              { type: "email", message: "To'g'ri email kiriting" },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="example@mail.com"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Parol"
            rules={[{ required: true, message: "Parol kiriting" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Enter your password"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{
                borderRadius: 10,
                background: "linear-gradient(135deg,#36cfc9,#096dd9)",
                fontWeight: "600",
              }}
            >
              Kirish
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
