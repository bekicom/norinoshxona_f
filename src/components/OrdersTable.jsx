import { Table } from "antd";

const OrdersTable = ({ orders }) => {
  const columns = [
    { title: "№", dataIndex: "daily_order_number", key: "number" },
    { title: "Sana", dataIndex: "order_date", key: "date" },
    { title: "Stol", dataIndex: "table_number", key: "table" },
    { title: "Waiter", dataIndex: "waiter_name", key: "waiter" },
    { title: "Summa", dataIndex: "final_total", key: "total" },
    { title: "Holat", dataIndex: "status", key: "status" },
  ];

  return (
    <Table
      dataSource={orders}
      columns={columns}
      rowKey="_id"
      pagination={{ pageSize: 10 }}
    />
  );
};

export default OrdersTable;
