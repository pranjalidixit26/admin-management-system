import { useState, useEffect } from 'react';
import { Table, Input, Tag, Select, message, Modal, Descriptions, Typography, Space, Button, Divider, DatePicker } from 'antd';
import { Dayjs } from 'dayjs';
import { EyeOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import api from '../../api/axios';
import { hasPermission } from '../../utils/permissions';

const { Text } = Typography;

// TODO: confirm these against the actual OrderStatus enum in order.entity.ts
// and adjust the list/colors below to match exactly.
const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'gold',
  confirmed: 'blue',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

// Light tints used behind the status Select so a row's state is readable at a glance
const STATUS_TINTS: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: '#fffbe6', border: '#ffe58f', text: '#ad6800' },
  confirmed: { bg: '#e6f4ff', border: '#91caff', text: '#0958d9' },
  shipped: { bg: '#f9f0ff', border: '#d3adf7', text: '#531dab' },
  delivered: { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d' },
  cancelled: { bg: '#fff1f0', border: '#ffa39e', text: '#cf1322' },
};

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface OrderItem {
  id: number;
  productName: string;
  attributesSnapshot: string;
  price: string;
  quantity: number;
}

interface Order {
  id: number;
  customerId: number;
  customer: Customer;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  items: OrderItem[];
  totalAmount: string;
  status: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  created_at: string;
  updated_at: string;
}

interface OrdersTableProps {
  refreshKey: number;
  onStatusChanged: () => void;
}

export default function OrdersTable({ refreshKey, onStatusChanged }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string | undefined>(undefined);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const limit = 10;

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const canUpdateStatus = hasPermission('ORDER_UPDATE_STATUS');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/admin', {
        params: {
          page,
          limit,
          search,
          status: statusFilter,
          startDate: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
          endDate: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
        },
      });

      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, page, search, statusFilter, dateRange]);

  const handleViewDetails = async (orderId: number) => {
    setDetailsVisible(true);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/orders/admin/${orderId}`);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error(err);
      message.error('Failed to load order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/admin/${orderId}/status`, { status: newStatus });
      message.success(`Order #${orderId} marked as ${newStatus}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      onStatusChanged();
    } catch (err) {
      console.error(err);
      message.error('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownloadInvoice = async (orderId: number) => {
    try {
        const res = await api.get(`/orders/admin/${orderId}/invoice`, {
        responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-order-${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) {
        console.error(err);
        message.error('Could not download invoice');
    }
    };

  const [exportingCsv, setExportingCsv] = useState(false);

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const res = await api.get('/orders/admin/export/csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-export-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      message.error('Could not export orders');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedRowKeys.length === 0) return;
    setBulkUpdating(true);
    try {
      await api.patch('/orders/admin/bulk-status', {
        orderIds: selectedRowKeys,
        status: bulkStatus,
      });
      message.success(`${selectedRowKeys.length} order(s) marked as ${bulkStatus}`);
      setSelectedRowKeys([]);
      setBulkStatus(undefined);
      fetchOrders();
    } catch (err) {
      console.error(err);
      message.error('Failed to update selected orders');
    } finally {
      setBulkUpdating(false);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
          #{id}
        </Text>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, record: Order) => (
        <div>
          <div>{record.customer?.name ?? '-'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.customer?.email ?? '-'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      render: (_: unknown, record: Order) => (
        <Text type="secondary">
          {record.items.length} item{record.items.length !== 1 ? 's' : ''}
        </Text>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      sorter: (a: Order, b: Order) => Number(a.totalAmount) - Number(b.totalAmount),
      render: (amount: string) => <Text strong>₹{Number(amount).toFixed(2)}</Text>,
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (_: unknown, record: Order) =>
        record.razorpayPaymentId ? (
          <Tag color="green" style={{ borderRadius: 10, margin: 0 }}>
            Paid
          </Tag>
        ) : (
          <Tag color="orange" style={{ borderRadius: 10, margin: 0 }}>
            Payment Pending
          </Tag>
        ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: Order) => {
        const tint = STATUS_TINTS[record.status];
        return canUpdateStatus ? (
          <Select
            value={record.status}
            size="small"
            style={{
              width: 140,
              backgroundColor: tint?.bg,
              borderRadius: 6,
            }}
            popupMatchSelectWidth={false}
            loading={updatingId === record.id}
            onChange={(value) => handleStatusChange(record.id, value)}
            options={ORDER_STATUS_OPTIONS.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
        ) : (
          <Tag color={STATUS_COLORS[record.status] ?? 'default'} style={{ borderRadius: 10, textTransform: 'capitalize' }}>
            {record.status}
          </Tag>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a: Order, b: Order) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: Order) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record.id)}
          aria-label="View order details"
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Input.Search
          placeholder="Search orders (customer name, email...)"
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          style={{ maxWidth: 300 }}
          allowClear
        />
        <Select
          placeholder="Filter by status"
          allowClear
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          options={ORDER_STATUS_OPTIONS.map((s) => ({
            value: s,
            label: s.charAt(0).toUpperCase() + s.slice(1),
          }))}
        />
        <DatePicker.RangePicker
          value={dateRange as any}
          onChange={(dates) => {
            setDateRange(dates as [Dayjs | null, Dayjs | null] | null);
            setPage(1);
          }}
          format="DD MMM YYYY"
        />
        <Button
          icon={<FileExcelOutlined />}
          loading={exportingCsv}
          onClick={handleExportCsv}
        >
          Export CSV
        </Button>
      </div>

      {selectedRowKeys.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            padding: '10px 16px',
            background: '#eef2ff',
            borderRadius: 8,
          }}
        >
          <Text>{selectedRowKeys.length} order(s) selected</Text>
          <Select
            placeholder="Mark selected as..."
            style={{ width: 180 }}
            value={bulkStatus}
            onChange={setBulkStatus}
            options={ORDER_STATUS_OPTIONS.map((s) => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
          <Button
            type="primary"
            loading={bulkUpdating}
            disabled={!bulkStatus}
            onClick={handleBulkUpdate}
          >
            Apply
          </Button>
          <Button onClick={() => setSelectedRowKeys([])}>Clear</Button>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        bordered
        size="middle"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
        }}
        onRow={() => ({ style: { cursor: 'default' } })}
      />

      <Modal
        title={selectedOrder ? `Order #${selectedOrder.id}` : 'Order details'}
        open={detailsVisible}
        onCancel={() => {
          setDetailsVisible(false);
          setSelectedOrder(null);
        }}
        footer={null}
        width={640}
      >
        {detailsLoading || !selectedOrder ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong style={{ fontSize: 15 }}>
                  {selectedOrder.customer?.name ?? '-'}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {selectedOrder.customer?.email}
                </Text>
              </div>
              <Space size={8}>
                {selectedOrder.razorpayPaymentId ? (
                  <Tag color="green" style={{ margin: 0 }}>
                    Paid
                  </Tag>
                ) : (
                  <Tag color="orange" style={{ margin: 0 }}>
                    Payment Pending
                  </Tag>
                )}
                <Tag color={STATUS_COLORS[selectedOrder.status] ?? 'default'} style={{ textTransform: 'capitalize', margin: 0 }}>
                  {selectedOrder.status}
                </Tag>
              </Space>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Shipping Address">
                {selectedOrder.addressLine}, {selectedOrder.city}, {selectedOrder.state} -{' '}
                {selectedOrder.pincode}, {selectedOrder.country}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedOrder.phone}</Descriptions.Item>
              <Descriptions.Item label="Payment ID">
                <Text copyable={!!selectedOrder.razorpayPaymentId}>
                  {selectedOrder.razorpayPaymentId ?? '-'}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '12px 0' }} />

            <div>
              <Text strong>Items</Text>
              <div style={{ marginTop: 10 }}>
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div>
                      <Text>{item.productName}</Text>{' '}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        × {item.quantity}
                      </Text>
                    </div>
                    <Text>₹{(Number(item.price) * item.quantity).toFixed(2)}</Text>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '2px solid #1f2937',
                }}
              >
                <Text strong style={{ fontSize: 15 }}>
                  Total
                </Text>
                <Text strong style={{ fontSize: 15 }}>
                  ₹{Number(selectedOrder.totalAmount).toFixed(2)}
                </Text>
              </div>
            </div>

            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadInvoice(selectedOrder.id)}
              style={{ marginTop: 12 }}
              block
            >
              Download Invoice
            </Button>
          </Space>
        )}
      </Modal>
    </div>
  );
}