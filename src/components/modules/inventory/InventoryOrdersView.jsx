import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  ShoppingCart, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  PackagePlus, 
  FileText, 
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { api } from '../../../api/client';

export default function InventoryOrdersView({ onNotify, onRefreshDashboard }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Product Modal State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: 'Grains & Staples',
    currentStock: 10,
    minThreshold: 15,
    unit: 'bags',
    unitPrice: 1500
  });

  // New Order Modal State
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(20);
  const [orderNotes, setOrderNotes] = useState('Bulk wholesale order');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes] = await Promise.all([
        api.inventory.getProducts(),
        api.orders.getOrders()
      ]);
      setProducts(prodRes.products || []);
      setOrders(ordRes.orders || []);
      if (prodRes.products && prodRes.products.length > 0 && !selectedProductId) {
        setSelectedProductId(prodRes.products[0].id);
      }
    } catch (err) {
      onNotify('Error Loading Data', err.message, 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStockAdjust = async (productId, delta) => {
    try {
      await api.inventory.updateStock(productId, null, delta);
      onNotify('Stock Updated', `Stock quantity adjusted by ${delta > 0 ? `+${delta}` : delta}.`, 'success');
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Update Failed', err.message, 'warning');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.inventory.addProduct(newProduct);
      onNotify('Product Added', `Added ${newProduct.name} to business catalog.`, 'success');
      setShowAddProduct(false);
      setNewProduct({
        sku: '',
        name: '',
        category: 'Grains & Staples',
        currentStock: 10,
        minThreshold: 15,
        unit: 'bags',
        unitPrice: 1500
      });
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Failed to Add Product', err.message, 'warning');
    }
  };

  const handleDraftReplenish = async (productId) => {
    try {
      const res = await api.inventory.replenish(productId);
      onNotify('Replenishment Drafted', res.message, 'success');
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Drafting Failed', err.message, 'warning');
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await api.orders.createOrder({
        items: [{ productId: selectedProductId, quantity: parseInt(orderQuantity, 10) }],
        notes: orderNotes
      });

      if (res.hasShortage) {
        onNotify('Shortage Detected!', res.message, 'warning');
      } else {
        onNotify('Order Created', res.message, 'success');
      }

      setShowCreateOrder(false);
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Order Creation Failed', err.message, 'warning');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.orders.updateStatus(orderId, newStatus);
      onNotify('Status Updated', `Order marked as "${newStatus}".`, 'success');
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Update Failed', err.message, 'warning');
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Inventory & Order Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock tracking, automated deficit analysis, and purchase-order generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Stock & Inventory ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Customer Orders ({orders.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Refresh records"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'inventory' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Product Inventory Records</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-medium">
                {products.filter(p => p.status === 'Critical' || p.status === 'Low Stock').length} Need Attention
              </span>
            </div>
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">SKU / Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Unit Price</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isCritical = p.status === 'Critical';
                  const isLow = p.status === 'Low Stock';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku} {p.supplier_name && `• Vendor: ${p.supplier_name}`}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStockAdjust(p.id, -1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold leading-none"
                            title="Decrement stock"
                          >
                            -
                          </button>
                          <span>{p.current_stock} {p.unit}</span>
                          <button
                            onClick={() => handleStockAdjust(p.id, 1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold leading-none"
                            title="Increment stock"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">{p.min_threshold} {p.unit}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">₹{p.unit_price}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isCritical ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          isLow ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 animate-pulse"></span>}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(isCritical || isLow) ? (
                          <button
                            onClick={() => handleDraftReplenish(p.id)}
                            className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold transition"
                          >
                            Draft PO
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Stock Safe</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Customer Orders & Stock Allocation</span>
              <p className="text-[11px] text-slate-500">Orders automatically check stock availability upon submission</p>
            </div>
            <button
              onClick={() => setShowCreateOrder(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Simulate Customer Order</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 hover:bg-slate-50/60 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-sky-700">{ord.order_number}</span>
                      <span className="text-xs font-semibold text-slate-800">{ord.customer_name || 'Direct Wholesale Client'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        ord.status.includes('Shortage') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        ord.status === 'Dispatched' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                    {ord.notes && <p className="text-[11px] text-slate-500 mt-0.5">{ord.notes}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">₹{parseFloat(ord.total_amount).toLocaleString('en-IN')}</span>
                    {ord.status !== 'Dispatched' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'Dispatched')}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold transition"
                      >
                        Dispatch Order
                      </button>
                    )}
                  </div>
                </div>

                {/* Items breakdown */}
                {ord.items && ord.items.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                    {ord.items.map((itm) => (
                      <span
                        key={itm.id}
                        className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                          itm.status === 'Shortage'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {itm.quantity}x {itm.product_name} {itm.status === 'Shortage' && `(Shortage - Stock was only ${itm.current_stock})`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">Add New Inventory Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product SKU</label>
                <input
                  type="text"
                  required
                  placeholder="SKU-2001"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masoor Dal Premium (25kg)"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    required
                    value={newProduct.currentStock}
                    onChange={(e) => setNewProduct({ ...newProduct, currentStock: parseInt(e.target.value, 10) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    required
                    value={newProduct.minThreshold}
                    onChange={(e) => setNewProduct({ ...newProduct, minThreshold: parseInt(e.target.value, 10) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.unitPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulate Customer Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-800 mb-2">Simulate Customer Order</h3>
            <p className="text-xs text-slate-500 mb-4">
              Demonstrates automatic inventory stock comparison, deficit detection, and replenishment draft generation.
            </p>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.current_stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ordered Quantity (Try ordering more than current stock to trigger shortage)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Order Notes</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateOrder(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
