import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Col,
  Row,
  Button,
  Space,
  message,
  Statistic,
  Table,
  Select,
  Tag,
  Progress,
  Tooltip,
  Avatar,
  Divider,
  Badge,
} from "antd";
import {
  DollarOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  PercentageOutlined,
  WalletOutlined,
  UserOutlined,
  ReloadOutlined,
  FilterOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import API from "../services/api";
import moment from "moment";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [period, setPeriod] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [startDate, setStartDate] = useState(null); // ✅ Alohida startDate
  const [endDate, setEndDate] = useState(null); // ✅ Alohida endDate
  const [activeTab, setActiveTab] = useState("overview");
  const [branch, setBranch] = useState("1");
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);

  const [processedStats, setProcessedStats] = useState({
    totalOrders: 0,
    totalIncome: 0,
    totalCash: 0,
    totalCard: 0,
    totalClick: 0,
    totalServiceAmount: 0,
    averageOrderValue: 0,
    growthRate: 0,
  });
  const [waiterStats, setWaiterStats] = useState([]);
  const [allSoldItems, setAllSoldItems] = useState([]);
  const [popularDishes, setPopularDishes] = useState([]);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    message.success("Chiqdingiz ✅");
    navigate("/login", { replace: true });
  };

  // ✅ TEZ TUGMALAR FUNKSIYASI
  const handleQuickFilter = useCallback((days, label) => {
    const end = moment().endOf("day");
    const start = moment().subtract(days, "days").startOf("day");

    setStartDate(start.toDate()); // ✅ Date object
    setEndDate(end.toDate());
    setActiveQuickFilter(label);
    setPeriod(null);

    console.log(
      `Tez filtr: ${label} — Start: ${start.format(
        "YYYY-MM-DD"
      )}, End: ${end.format("YYYY-MM-DD")}`
    ); // Debug
    message.success(`${label} tanlandi`);
  }, []);

  // ✅ SANA BO'YICHA FILTR FUNKSIYASI
  const applyDateRangeFilter = useCallback((start, end) => {
    setStartDate(start);
    setEndDate(end);
    setActiveQuickFilter(null);
    setPeriod(null);
    console.log(
      `Custom filtr: Start: ${moment(start).format(
        "YYYY-MM-DD"
      )}, End: ${moment(end).format("YYYY-MM-DD")}`
    ); // Debug
    message.info(
      `Sana oralig'i: ${moment(start).format("DD.MM.YYYY")} - ${moment(
        end
      ).format("DD.MM.YYYY")}`
    );
  }, []);

  const fetchOrders = useCallback(
    async (selectedBranch = branch) => {
      const startTime = Date.now();
      setLoading(true);

      try {
        // ✅ Har doim ko'proq ma'lumot olamiz (sana filtrini serverga yubormaymiz, frontendda qilamiz)
        const params = {
          limit: 2000, // Ko'tarib oldik, agar ko'p ma'lumot bo'lsa
          page: 1,
        };

        const url = `/orders/branch/${selectedBranch}`;
        console.log("🚀 So'rov boshlandi:", url, params);

        const res = await API.get(url, { params });

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        console.log(
          `✅ Javob keldi: ${duration} sekund, ${
            res.data?.length || 0
          } ta buyurtma`
        );

        setOrders(res.data || []);
        message.success(
          `${selectedBranch}-filial ma'lumotlari yangilandi (${duration.toFixed(
            1
          )}s, ${res.data?.length || 0} ta buyurtma)`
        );
      } catch (err) {
        console.error("❌ Xato:", err.message, err.response?.data);
        message.error("Ma'lumotlarni olishda xato");
      } finally {
        setLoading(false);
      }
    },
    [branch]
  );

  // ✅ Faqat branch o'zgarganda yoki initial yuklashda fetch qilamiz
  useEffect(() => {
    fetchOrders();
  }, [branch]);

  const filteredOrdersByPeriod = useMemo(() => {
    if (!orders.length) return [];

    let filtered = orders;

    // ✅ Har doim frontendda filtrlaymiz
    if (startDate && endDate) {
      const start = moment(startDate).startOf("day");
      const end = moment(endDate).endOf("day");
      filtered = filtered.filter((order) => {
        const orderDate = moment(order.createdAt || order.order_date);
        const isBetween = orderDate.isBetween(start, end, null, "[]");
        if (!isBetween) {
          console.log(
            `Filtrdan o'tmadi: ${order._id}, sana: ${orderDate.format(
              "YYYY-MM-DD"
            )}`
          ); // Debug
        }
        return isBetween;
      });
      console.log(
        `Filtrlangan buyurtmalar (sana ${start.format("DD.MM")} - ${end.format(
          "DD.MM"
        )}): ${filtered.length} ta (jami: ${orders.length})`
      );
    }
    // ✅ Agar sana yo'q bo'lsa, period bo'yicha filterlash
    else if (period) {
      const now = moment();
      let startDateMoment;

      switch (period) {
        case "daily":
          startDateMoment = now.clone().startOf("day");
          break;
        case "monthly":
          startDateMoment = now.clone().startOf("month");
          break;
        case "yearly":
          startDateMoment = now.clone().startOf("year");
          break;
        default:
          startDateMoment = now.clone().startOf("day");
      }

      filtered = filtered.filter((order) => {
        const orderDate = moment(order.createdAt || order.order_date);
        return orderDate.isAfter(startDateMoment);
      });
      console.log(
        `Filtrlangan buyurtmalar (period ${period}): ${filtered.length} ta`
      );
    }

    return filtered;
  }, [orders, period, startDate, endDate]);

  useEffect(() => {
    if (!filteredOrdersByPeriod.length) {
      setProcessedStats({
        totalOrders: 0,
        totalIncome: 0,
        totalCash: 0,
        totalCard: 0,
        totalClick: 0,
        totalServiceAmount: 0,
        averageOrderValue: 0,
        growthRate: 0,
      });
      setWaiterStats([]);
      setAllSoldItems([]);
      setPopularDishes([]);
      console.log("Filtr natijasi: Hech qanday buyurtma topilmadi"); // Debug
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      const processStartTime = Date.now();

      const ordersToProcess = filteredOrdersByPeriod;
      const totalOrders = ordersToProcess.length;
      let totalIncome = 0;
      let totalCash = 0;
      let totalCard = 0;
      let totalClick = 0;
      let totalServiceAmount = 0;
      const waiterStatsMap = {};
      const allItems = [];
      const dishStatsMap = {};

      ordersToProcess.forEach((order) => {
        const orderTotal = order.final_total || order.total_price || 0;
        const serviceAmount = order.service_amount || 0;

        totalIncome += orderTotal;
        totalServiceAmount += serviceAmount;

        if (order.paymentMethod === "cash") {
          totalCash += orderTotal;
        } else if (order.paymentMethod === "card") {
          totalCard += orderTotal;
        } else if (order.paymentMethod === "click") {
          totalClick += orderTotal;
        } else if (order.mixedPaymentDetails) {
          totalCash += order.mixedPaymentDetails.cashAmount || 0;
          totalCard += order.mixedPaymentDetails.cardAmount || 0;
        }

        if (order.waiter_name) {
          if (!waiterStatsMap[order.waiter_name]) {
            waiterStatsMap[order.waiter_name] = {
              name: order.waiter_name,
              orders: 0,
              totalSales: 0,
              monthlyCommission: 0,
            };
          }
          waiterStatsMap[order.waiter_name].orders++;
          waiterStatsMap[order.waiter_name].totalSales += orderTotal;
          waiterStatsMap[order.waiter_name].monthlyCommission += serviceAmount;
        }

        const orderItems = order.items || order.ordered_items || [];
        orderItems.forEach((item) => {
          const qty = item.quantity || 1;
          const price = item.price || item.unit_price || 0;
          const itemName = item.name || item.item_name;

          if (!dishStatsMap[itemName]) {
            dishStatsMap[itemName] = {
              name: itemName,
              category: item.category_name || item.category || "Boshqa",
              sold: 0,
              revenue: 0,
            };
          }
          dishStatsMap[itemName].sold += qty;
          dishStatsMap[itemName].revenue += price * qty;

          allItems.push({
            key: `${order._id}-${item._id || Math.random()}`,
            orderId: order._id || order.id,
            orderNumber: order.daily_order_number || order.order_number,
            date: order.createdAt || order.order_date,
            itemName: itemName,
            category: item.category_name || item.category || "Boshqa",
            quantity: qty,
            price: price,
            subtotal: price * qty,
            waiterName: order.waiter_name,
            tableNumber: order.table_number,
          });
        });
      });

      Object.values(waiterStatsMap).forEach((waiter) => {
        waiter.servicePercentage =
          totalServiceAmount > 0
            ? ((waiter.monthlyCommission / totalServiceAmount) * 100).toFixed(1)
            : 0;
      });

      const averageOrderValue = totalOrders > 0 ? totalIncome / totalOrders : 0;

      // ✅ Growth rate ni custom range uchun 0 qilish
      const growthRate =
        startDate && endDate
          ? 0
          : ((totalOrders / (orders.length - totalOrders || 1)) * 100).toFixed(
              1
            );

      setProcessedStats({
        totalOrders,
        totalIncome,
        totalCash,
        totalCard,
        totalClick,
        totalServiceAmount,
        averageOrderValue,
        growthRate,
      });

      setWaiterStats(
        Object.values(waiterStatsMap)
          .sort((a, b) => b.monthlyCommission - a.monthlyCommission)
          .map((waiter, index) => ({ ...waiter, key: index }))
      );

      setAllSoldItems(
        allItems.sort((a, b) => new Date(b.date) - new Date(a.date))
      );

      setPopularDishes(
        Object.values(dishStatsMap)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 10)
      );

      const processEndTime = Date.now();
      const processDuration = (processEndTime - processStartTime) / 1000;
      console.log(
        `⚡ Ma'lumotlar qayta ishlandi: ${processDuration.toFixed(
          2
        )} sekund, ${totalOrders} ta buyurtma`
      );

      setProcessing(false);
    }, 50);
  }, [filteredOrdersByPeriod, orders.length, startDate, endDate]);

  const filteredSoldItems = useMemo(() => {
    if (!allSoldItems.length) return [];

    if (filterCategory === "all") {
      return allSoldItems;
    }

    return allSoldItems.filter((item) => item.category === filterCategory);
  }, [allSoldItems, filterCategory]);

  // ✅ AGGREGATED SOLD ITEMS FOR PRODUCTS TAB (yangi qo'shildi)
  const aggregatedSoldItems = useMemo(() => {
    if (!allSoldItems.length) return [];

    const aggregatedMap = {};

    allSoldItems.forEach((item) => {
      const key = `${item.itemName}-${item.category}`;
      if (!aggregatedMap[key]) {
        aggregatedMap[key] = {
          key,
          itemName: item.itemName,
          category: item.category,
          totalQuantity: 0,
          totalRevenue: 0,
          avgPrice: 0,
          orderCount: new Set(),
        };
      }
      aggregatedMap[key].totalQuantity += item.quantity;
      aggregatedMap[key].totalRevenue += item.subtotal;
      aggregatedMap[key].orderCount.add(item.orderId);
      // Avg price ni so'ng hisoblaymiz
    });

    const aggregated = Object.values(aggregatedMap).map((agg) => {
      agg.avgPrice = agg.totalRevenue / agg.totalQuantity;
      agg.orderCount = agg.orderCount.size; // Sonini olish
      return agg;
    });

    // Kategoriya bo'yicha filter
    if (filterCategory !== "all") {
      return aggregated.filter((item) => item.category === filterCategory);
    }

    return aggregated.sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [allSoldItems, filterCategory]);

  const categories = useMemo(() => {
    if (!allSoldItems.length) return ["all"];
    const uniqueCats = [...new Set(allSoldItems.map((item) => item.category))];
    return ["all", ...uniqueCats.sort()];
  }, [allSoldItems]);

  const ModernStatCard = ({
    title,
    value,
    icon,
    color,
    prefix = "",
    suffix = "",
    growth,
    subtitle,
  }) => (
    <Card
      style={{
        height: "100%",
        borderRadius: "12px",
        background: "#ffffff",
        border: `1px solid ${color}20`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
      bodyStyle={{ padding: "16px" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: "#666",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "6px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: color,
              marginBottom: "4px",
            }}
          >
            {prefix}
            {value?.toLocaleString()}
            {suffix}
          </div>
          {subtitle && (
            <div style={{ fontSize: "11px", color: "#999" }}>{subtitle}</div>
          )}
          {growth !== undefined && growth !== 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "6px",
                fontSize: "11px",
                color: growth > 0 ? "#52c41a" : "#ff4d4f",
              }}
            >
              {growth > 0 ? <RiseOutlined /> : <FallOutlined />}
              <span style={{ marginLeft: "2px" }}>{Math.abs(growth)}%</span>
            </div>
          )}
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  const waiterColumns = [
    {
      title: "Afitsant",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{ backgroundColor: "#7265e6" }}
          />
          <div style={{ fontWeight: "600" }}>{name}</div>
        </div>
      ),
    },
    {
      title: "Buyurtmalar",
      dataIndex: "orders",
      key: "orders",
      render: (orders) => (
        <Tag color="blue" style={{ fontSize: "12px" }}>
          {orders}
        </Tag>
      ),
      sorter: (a, b) => a.orders - b.orders,
    },
    {
      title: "Oylik",
      dataIndex: "monthlyCommission",
      key: "monthlyCommission",
      render: (commission, record) => (
        <div>
          <div
            style={{ fontWeight: "bold", color: "#722ed1", fontSize: "14px" }}
          >
            {commission?.toLocaleString()} so'm
          </div>
          <Progress
            percent={Math.min(record.servicePercentage, 100)}
            size="small"
            strokeColor="#722ed1"
            showInfo={false}
          />
        </div>
      ),
      sorter: (a, b) => a.monthlyCommission - b.monthlyCommission,
    },
  ];

  // ✅ YANGI AGGREGATED COLUMNS FOR PRODUCTS TAB
  const aggregatedSoldItemsColumns = [
    {
      title: "Taom",
      dataIndex: "itemName",
      key: "itemName",
      width: 200,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: "600", fontSize: "13px" }}>{name}</div>
          <Tag color="geekblue" style={{ fontSize: "9px", marginTop: "2px" }}>
            {record.category}
          </Tag>
        </div>
      ),
      sorter: (a, b) => a.itemName.localeCompare(b.itemName),
    },
    {
      title: "Umumiy Miqdor",
      dataIndex: "totalQuantity",
      key: "totalQuantity",
      width: 100,
      render: (qty) => (
        <Tag color="green" style={{ fontSize: "11px" }}>
          {qty}
        </Tag>
      ),
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
    },
    {
      title: "O'rtacha Narx",
      dataIndex: "avgPrice",
      key: "avgPrice",
      width: 120,
      render: (price) => (
        <div style={{ fontWeight: "500", fontSize: "12px" }}>
          {Math.round(price)?.toLocaleString()} so'm
        </div>
      ),
      sorter: (a, b) => a.avgPrice - b.avgPrice,
    },
    {
      title: "Umumiy Daromad",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      width: 120,
      render: (revenue) => (
        <div style={{ fontWeight: "bold", color: "#1890ff", fontSize: "12px" }}>
          {revenue?.toLocaleString()} so'm
        </div>
      ),
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
    },
    {
      title: "Buyurtma Soni",
      dataIndex: "orderCount",
      key: "orderCount",
      width: 100,
      render: (count) => (
        <Tag color="blue" style={{ fontSize: "11px" }}>
          {count} ta
        </Tag>
      ),
      sorter: (a, b) => a.orderCount - b.orderCount,
    },
  ];

  const periodLabels = {
    daily: "Bugungi",
    monthly: "Oylik",
    yearly: "Yillik",
  };

  // ✅ Header uchun label
  const headerLabel = useMemo(() => {
    if (startDate && endDate) {
      return `Hisobot • ${moment(startDate).format("DD.MM.YYYY")} - ${moment(
        endDate
      ).format("DD.MM.YYYY")}`;
    } else {
      return `${periodLabels[period] || "Bugungi"} hisobot • ${moment().format(
        "DD.MM.YYYY"
      )}`;
    }
  }, [startDate, endDate, period]);

  if (loading && !orders.length) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍽️</div>
          <h2 style={{ color: "white", marginBottom: "8px" }}>
            Roxat Restoran
          </h2>
          <p>Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          color: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "bold" }}>
            Roxat
          </h1>
          <p style={{ margin: "4px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
            {headerLabel}
            {processing && <span> • ⚡ Hisoblanyapti...</span>}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            alignItems: "center",
            gap: "22px",
          }}
        >
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => fetchOrders()}
            loading={loading}
            size="middle"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "8px",
              fontWeight: "600",
            }}
          >
            Yangilash
          </Button>

          <Space>
            <Select
              value={branch}
              onChange={(val) => {
                setBranch(val);
              }}
              style={{ width: 160 }}
              loading={loading}
            >
              <Select.Option value="1">NOVOIY-filial</Select.Option>
              <Select.Option value="2">DOSLIK-filial</Select.Option>
              <Select.Option value="3">To'raqo'rg'on-filial</Select.Option>
            </Select>
          </Space>
          <Button
            type="default"
            style={{
              fontWeight: "600",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.4)",
            }}
            onClick={() =>
              (window.location.href = "https://Roxat-faceid-f.vercel.app/")
            }
          >
            Roxat-davomat
          </Button>

          <Button
            type="default"
            danger
            onClick={handleLogout}
            style={{
              fontWeight: "600",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.4)",
            }}
          >
            Chiqish
          </Button>
        </div>

        <Divider
          style={{ background: "rgba(255,255,255,0.2)", margin: "12px 0" }}
        />
      </div>

      {/* Tab Navigatsiya */}
      <Card
        style={{
          marginBottom: "20px",
          borderRadius: "12px",
          border: "none",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
        bodyStyle={{ padding: "6px" }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { key: "overview", label: "Hisobot", icon: <BarChartOutlined /> },
            { key: "waiters", label: "Ofitsiant", icon: <UserOutlined /> },
            {
              key: "products",
              label: "Mahsulotlar ",
              icon: <ShoppingCartOutlined />,
            },
          ].map((tab) => (
            <Button
              key={tab.key}
              type={activeTab === tab.key ? "primary" : "text"}
              onClick={() => setActiveTab(tab.key)}
              icon={tab.icon}
              style={{
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "12px",
                height: "32px",
                width: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                border: "1px solid gray",
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* ✅ TEZ TUGMALAR VA SANA SELECTOR */}
      <Card
        style={{
          marginBottom: "20px",
          borderRadius: "12px",
          border: "none",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
        bodyStyle={{ padding: "16px" }}
      >
        {/* Tez Tugmalar */}
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            ⚡ Tez Filtrlar:
          </div>
          <Space wrap size="small">
            <Button
              size="small"
              type={activeQuickFilter === "Bugun" ? "primary" : "default"}
              icon={<ClockCircleOutlined />}
              onClick={() => handleQuickFilter(0, "Bugun")}
              style={{ borderRadius: "6px", fontSize: "12px" }}
            >
              Bugun
            </Button>
            <Button
              size="small"
              type={activeQuickFilter === "Kecha" ? "primary" : "default"}
              icon={<HistoryOutlined />}
              onClick={() => handleQuickFilter(1, "Kecha")}
              style={{ borderRadius: "6px", fontSize: "12px" }}
            >
              Kecha
            </Button>
            <Button
              size="small"
              type={activeQuickFilter === "7 kun" ? "primary" : "default"}
              onClick={() => handleQuickFilter(7, "7 kun")}
              style={{ borderRadius: "6px", fontSize: "12px" }}
            >
              7 kun
            </Button>
            <Button
              size="small"
              type={activeQuickFilter === "15 kun" ? "primary" : "default"}
              onClick={() => handleQuickFilter(15, "15 kun")}
              style={{ borderRadius: "6px", fontSize: "12px" }}
            >
              15 kun
            </Button>
            <Button
              size="small"
              type={activeQuickFilter === "30 kun" ? "primary" : "default"}
              onClick={() => handleQuickFilter(30, "30 kun")}
              style={{ borderRadius: "6px", fontSize: "12px" }}
            >
              30 kun
            </Button>
            <Button
              size="small"
              type={activeQuickFilter === "Yillik" ? "primary" : "default"}
              onClick={() => handleQuickFilter(365, "Yillik")}
              style={{ borderRadius: "6px", fontSize: "12px" }}
            >
              Yillik
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: "12px 0" }} />

        {/* Davr va Custom Sana - ✅ Oddiy HTML input type="date" */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <Space size="small">
            <label style={{ fontSize: "12px", color: "#666" }}>
              Boshlang'ich sana:
            </label>
            <input
              type="date"
              value={startDate ? moment(startDate).format("YYYY-MM-DD") : ""}
              onChange={(e) => {
                const newStart = e.target.value
                  ? new Date(e.target.value)
                  : null;
                setStartDate(newStart);
                if (endDate && newStart > endDate) setEndDate(null); // Agar start > end bo'lsa, end ni tozalash
              }}
              style={{
                padding: "4px 8px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                fontSize: "12px",
                width: "120px",
              }}
            />
            <label style={{ fontSize: "12px", color: "#666" }}>
              Tugash sana:
            </label>
            <input
              type="date"
              value={endDate ? moment(endDate).format("YYYY-MM-DD") : ""}
              onChange={(e) => {
                const newEnd = e.target.value ? new Date(e.target.value) : null;
                setEndDate(newEnd);
                if (startDate && newEnd < startDate) setStartDate(null); // Agar end < start bo'lsa, start ni tozalash
              }}
              style={{
                padding: "4px 8px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                fontSize: "12px",
                width: "120px",
              }}
            />
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setFilterCategory("all");
                setStartDate(null);
                setEndDate(null);
                setActiveQuickFilter(null);
                setPeriod("daily");
              }}
              size="small"
            >
              Tozalash
            </Button>
          </Space>
        </div>
      </Card>

      {activeTab === "overview" && (
        <>
          {/* Asosiy statistika kartalari */}
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={12} lg={6}>
              <ModernStatCard
                title="Buyurtmalar"
                value={processedStats.totalOrders}
                icon={<ShoppingCartOutlined />}
                color="#1890ff"
                growth={parseFloat(processedStats.growthRate)}
              />
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <ModernStatCard
                title="Tushum"
                value={processedStats.totalIncome}
                icon={<DollarOutlined />}
                color="#52c41a"
                suffix=" so'm"
                subtitle={`O'rtacha: ${Math.round(
                  processedStats.averageOrderValue
                ).toLocaleString()} so'm`}
              />
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <ModernStatCard
                title="Afitsiantlar Oyligi"
                value={processedStats.totalServiceAmount}
                icon={<WalletOutlined />}
                color="#722ed1"
                suffix=" so'm"
              />
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <ModernStatCard
                title="Naqd Pul"
                value={processedStats.totalCash}
                icon={<DollarOutlined />}
                color="#13c2c2"
                suffix=" so'm"
                subtitle={
                  processedStats.totalIncome > 0
                    ? `${(
                        (processedStats.totalCash /
                          processedStats.totalIncome) *
                        100
                      ).toFixed(1)}% tushumdan`
                    : ""
                }
              />
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <ModernStatCard
                title="Karta"
                value={processedStats.totalCard}
                icon={<CreditCardOutlined />}
                color="#f759ab"
                suffix=" so'm"
                subtitle={
                  processedStats.totalIncome > 0
                    ? `${(
                        (processedStats.totalCard /
                          processedStats.totalIncome) *
                        100
                      ).toFixed(1)}% tushumdan`
                    : ""
                }
              />
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <ModernStatCard
                title="Click"
                value={processedStats.totalClick}
                icon={<CreditCardOutlined />}
                color="#fa8c16"
                suffix=" so'm"
                subtitle={
                  processedStats.totalIncome > 0
                    ? `${(
                        (processedStats.totalClick /
                          processedStats.totalIncome) *
                        100
                      ).toFixed(1)}% tushumdan`
                    : ""
                }
              />
            </Col>
          </Row>

          {/* Eng sotilgan taomlar */}
          <Card
            title="Eng Ko'p Sotilgan Taomlar"
            style={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              marginBottom: "20px",
            }}
            loading={processing}
          >
            {popularDishes.length > 0 ? (
              popularDishes.slice(0, 5).map((dish, index) => (
                <div
                  key={index}
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        background: "#1890ff",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>
                        {dish.name}
                      </div>
                      <Tag
                        color="blue"
                        size="small"
                        style={{ fontSize: "10px" }}
                      >
                        {dish.category}
                      </Tag>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#1890ff",
                        fontSize: "13px",
                      }}
                    >
                      {dish.sold} ta
                    </div>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      {dish.revenue.toLocaleString()} so'm
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#999" }}
              >
                {startDate && endDate
                  ? `Tanlangan sana oralig'ida (${moment(startDate).format(
                      "DD.MM"
                    )} - ${moment(endDate).format(
                      "DD.MM"
                    )}) hech qanday taom sotilmagan. Boshqa sana sinab ko'ring yoki API dan ko'proq ma'lumot yuklang.`
                  : "Hech qanday ma'lumot topilmadi"}
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === "waiters" && (
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <UserOutlined />
              <span>Ofitsiantlar</span>
              <Tag color="blue" style={{ fontSize: "11px" }}>
                {waiterStats?.length || 0} ta
              </Tag>
            </div>
          }
          style={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            marginBottom: "20px",
          }}
          loading={processing}
        >
          {waiterStats.length > 0 ? (
            <Table
              columns={waiterColumns}
              dataSource={waiterStats}
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ x: 700 }}
            />
          ) : (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#999" }}
            >
              {startDate && endDate
                ? `Tanlangan sana oralig'ida hech qanday ofitsiant faoliyat ko'rsatmagan.`
                : "Hech qanday ma'lumot topilmadi"}
            </div>
          )}
        </Card>
      )}

      {activeTab === "products" && (
        <Card
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <ShoppingCartOutlined />
                <span>Mahsulotlar (Jami)</span>
                <Tag color="green" style={{ fontSize: "11px" }}>
                  {aggregatedSoldItems.length} ta noyob mahsulot
                </Tag>
                {processing && (
                  <Tag color="orange" style={{ fontSize: "11px" }}>
                    Hisoblanyapti...
                  </Tag>
                )}
              </div>
              <Space size="small">
                <Select
                  placeholder="Kategoriya"
                  value={filterCategory}
                  onChange={setFilterCategory}
                  style={{ width: 120 }}
                  size="small"
                  suffixIcon={<FilterOutlined />}
                >
                  <Select.Option value="all">Barchasi</Select.Option>
                  {categories.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat === "all" ? "Barchasi" : cat}
                    </Select.Option>
                  ))}
                </Select>
              </Space>
            </div>
          }
          style={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
          loading={loading || processing}
        >
          {aggregatedSoldItems.length > 0 ? (
            <Table
              columns={aggregatedSoldItemsColumns}
              dataSource={aggregatedSoldItems}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                pageSizeOptions: ["20", "50", "100", "200"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} / ${total} ta mahsulot`,
                showQuickJumper: true,
              }}
              size="small"
              scroll={{ y: 500, x: 800 }}
              loading={processing}
            />
          ) : (
            <div
              style={{ textAlign: "center", padding: "20px", color: "#999" }}
            >
              {startDate && endDate
                ? `Tanlangan sana oralig'ida (${moment(startDate).format(
                    "DD.MM"
                  )} - ${moment(endDate).format(
                    "DD.MM"
                  )}) hech qanday mahsulot sotilmagan. API dan ko'proq ma'lumot yuklang yoki boshqa sana sinab ko'ring.`
                : "Hech qanday mahsulot topilmadi"}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
