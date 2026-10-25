import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, DollarSign, ShieldCheck, Plus, CheckCircle, CreditCard, Sparkles } from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'seller'>('catalog');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Seller Onboarding state
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [price, setPrice] = useState('299');
  const [category, setCategory] = useState('notes');
  const [sellerStatus, setSellerStatus] = useState<any>(null);

  // Checkout modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/national/marketplace')
      .then(res => res.json())
      .then((data: any) => {
        if (data.success) setProducts(data.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRegisterSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/national/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard_seller',
          title,
          authorName,
          price: Number(price),
          category
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setSellerStatus(data);
      }
    } catch (err) {
      console.error('Error onboarding seller:', err);
    }
  };

  const handleCheckout = async (product: any) => {
    setSelectedProduct(product);
    try {
      const res = await fetch('/api/v1/national/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: product.price,
          currency: 'INR',
          description: product.title,
          customerEmail: 'student@gtu.ac.in',
          customerPhone: '9876543210'
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setPaymentSuccess(data);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-orange-900 to-navy-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-sm font-bold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" /> Creator Marketplace & Store
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Peer & Faculty Notes Store</h1>
          <p className="text-orange-100 text-sm mt-1">
            Browse verified study guides or publish your own engineering notes with 85% creator revenue share.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-navy-950 p-1.5 rounded-xl border border-navy-700 shrink-0">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'catalog' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Store Catalog
          </button>
          <button
            onClick={() => setActiveTab('seller')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
              activeTab === 'seller' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Publish Material
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-sm text-gray-500 col-span-full">Loading marketplace catalog...</p>
          ) : (
            products.map((item: any) => (
              <div key={item.id} className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-orange-50 text-brand-orange dark:bg-orange-950 dark:text-orange-300 text-xs font-bold rounded-lg uppercase">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" /> {item.rating}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">By {item.authorName}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-navy-700 flex items-center justify-between">
                  <div className="text-lg font-black text-navy-900 dark:text-white">
                    ₹{item.price}
                  </div>
                  <button
                    onClick={() => handleCheckout(item)}
                    className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Buy Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Seller Onboarding Form */
        <div className="max-w-2xl mx-auto bg-white dark:bg-navy-800 p-8 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-navy-700 pb-4">
            <DollarSign className="w-8 h-8 text-brand-orange bg-orange-50 dark:bg-navy-900 p-1.5 rounded-xl" />
            <div>
              <h2 className="text-lg font-bold text-navy-900 dark:text-white">Creator Seller Onboarding</h2>
              <p className="text-xs text-gray-500">Keep 85% of every sale with instant direct payout settlement.</p>
            </div>
          </div>

          <form onSubmit={handleRegisterSeller} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Product Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Sem 5 Electrical Machine Handwritten Notes"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-navy-900 dark:border-navy-600 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Author / Faculty Name</label>
                <input
                  type="text"
                  required
                  placeholder="Prof. Sharma"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-navy-900 dark:border-navy-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Selling Price (INR)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-navy-900 dark:border-navy-600 text-sm"
                />
              </div>
            </div>

            {/* Revenue Share Calculator */}
            <div className="p-4 bg-orange-50 dark:bg-navy-900/50 rounded-xl text-xs space-y-1 font-medium text-navy-900 dark:text-orange-200">
              <div className="flex justify-between">
                <span>Creator Revenue (85%):</span>
                <span className="font-bold text-green-600">₹{(Number(price) * 0.85).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Platform Commission (15%):</span>
                <span>₹{(Number(price) * 0.15).toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md transition"
            >
              Publish to Marketplace
            </button>
          </form>

          {sellerStatus && (
            <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-xl text-xs text-green-800 dark:text-green-300 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span>Material submitted successfully! Creator Status: {sellerStatus.payoutStatus}.</span>
            </div>
          )}
        </div>
      )}

      {/* Payment Success Invoice Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-green-600 font-bold">
              <ShieldCheck className="w-6 h-6" /> Order & GST Invoice Generated
            </div>
            <p className="text-xs text-gray-500">Transaction ID: {paymentSuccess.order.id}</p>

            <div className="p-4 bg-gray-50 dark:bg-navy-900 rounded-xl text-xs space-y-2 font-mono">
              <div className="flex justify-between"><span>Base Amount:</span> <span>₹{paymentSuccess.invoice.baseAmount}</span></div>
              <div className="flex justify-between"><span>GST (18%):</span> <span>₹{paymentSuccess.invoice.gstAmount}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Total Paid:</span> <span>₹{paymentSuccess.invoice.totalAmount}</span></div>
            </div>

            <button
              onClick={() => setPaymentSuccess(null)}
              className="w-full py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold"
            >
              Close Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
