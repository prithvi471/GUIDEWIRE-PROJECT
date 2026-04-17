import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, MapPin, IndianRupee, Activity, CloudRain, 
  Map, AlertTriangle, CheckCircle, Briefcase, Plus,
  Wallet, TrendingUp, Calendar, Zap, AlertOctagon, History, FileText, Check
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

function App() {
  const [view, setView] = useState('register'); // 'register' or 'dashboard'
  const [userId, setUserId] = useState(null);

  const [form, setForm] = useState({ name: "", city: "", income: "", payoutAccount: "", loan: false, claims: 0 });
  
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filteredCities, setFilteredCities] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [previewPolicy, setPreviewPolicy] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCityChange = async (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, city: value }));
    setPreviewPolicy(null);
    if (value.trim().length >= 2) {
       try {
           const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${value}&format=json&countrycodes=in`);
           const names = [...new Set(res.data.map(item => item.display_name.split(',')[0]))];
           setFilteredCities(names);
           setShowDropdown(true);
       } catch (err) {
           console.error(err);
       }
    } else {
       setShowDropdown(false);
       setFilteredCities([]);
    }
  };

  const selectCity = async (city) => {
    setForm(prev => ({ ...prev, city }));
    setShowDropdown(false);
    try {
        setLoadingPreview(true);
        const res = await axios.post(`${API_BASE}/calculate`, { 
            preview: { city, income: form.income || 1000, loan: form.loan, claims: form.claims }
        });
        setPreviewPolicy(res.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoadingPreview(false);
    }
  };

  const handleGetLocation = () => {
      setLocLoading(true);
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
              const { latitude, longitude } = pos.coords;
              try {
                  const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                  const city = res.data.address.city || res.data.address.town || res.data.address.village || res.data.address.state_district || "";
                  if (city) {
                      selectCity(city);
                  }
              } catch (e) {
                  console.error(e);
              } finally {
                  setLocLoading(false);
              }
          }, () => setLocLoading(false));
      } else {
          setLocLoading(false);
      }
  };

  const handleToggle = () => setForm(prev => ({ ...prev, loan: !prev.loan }));

  // Flow: Razorpay Checkout -> Register -> Calculate Policy -> Load Dashboard
  const handleStartSubscription = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let policyCost = 500; // fallback default premium
      if (previewPolicy) {
          policyCost = previewPolicy.premium;
      } else {
          const calcRes = await axios.post(`${API_BASE}/calculate`, { 
              preview: { city: form.city, income: form.income, loan: form.loan, claims: form.claims }
          });
          policyCost = calcRes.data.premium;
      }

      const orderRes = await axios.post(`${API_BASE}/payment/order`, { amount: policyCost });
      const order = orderRes.data;

      const options = {
          key: "rzp_test_SeXFAL2hAq3CDh",
          amount: order.amount,
          currency: order.currency,
          name: "SafeDeliver Premium",
          description: "Weekly Income Protection",
          order_id: order.id,
          handler: async function (response) {
             try {
                setLoading(true);
                const regRes = await axios.post(`${API_BASE}/register`, {
                  name: form.name, 
                  city: form.city, 
                  weekly_income: Number(form.income), 
                  payoutAccount: form.payoutAccount,
                  loan: form.loan, 
                  claims: Number(form.claims)
                });
                const newUserId = regRes.data.id;
                setUserId(newUserId);

                await axios.post(`${API_BASE}/calculate`, { userId: newUserId });
                await axios.post(`${API_BASE}/add-money`, { userId: newUserId, amount: policyCost });

                await refreshDashboard(newUserId);
                setView('dashboard');
             } catch (err) {
                setError("Registration failed post-payment");
             } finally {
                setLoading(false);
             }
          },
          prefill: {
              name: form.name,
              contact: "9999999999"
          },
          theme: { color: "#4f46e5" }
      };

      const rzpPopup = new window.Razorpay(options);
      rzpPopup.on('payment.failed', function (response){
          setLoading(false);
          setError(response.error.description);
      });
      rzpPopup.open();

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || "Payment initiation failed.");
    }
  };

  const refreshDashboard = async (uid = userId) => {
    if (!uid) return;
    try {
      const res = await axios.get(`${API_BASE}/dashboard/${uid}`);
      setDashboard(res.data);
      const data = res.data;
      if (!data.claim && data.risk_monitoring && (data.risk_monitoring.disruption_status === 1 || (data.insurance_details && data.insurance_details.risk_probability > 0.7))) {
          try {
              await axios.post(`${API_BASE}/claim`, { userId: uid });
              const updatedRes = await axios.get(`${API_BASE}/dashboard/${uid}`);
              setDashboard(updatedRes.data);
          } catch (autoErr) {
              console.error("Auto-claim failed", autoErr);
          }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMoney = async () => {
    setLoading(true);
    await axios.post(`${API_BASE}/add-money`, { userId, amount: 200 });
    await refreshDashboard();
    setLoading(false);
  };

  const handleSimulateWeek = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/simulate-week`, { userId });
      await refreshDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClaim = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/claim`, { userId });
      await refreshDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const renderRegistrationView = () => (
    <div className="max-w-5xl mx-auto px-4 py-8 relative z-10 animate-fade-in-up">
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-indigo-900">
          SafeDeliver Platform
        </h1>
        <p className="text-gray-500 font-medium">Gig economy insurance. Automated AI pricing & smart claims.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 -mt-10 -mr-10"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-500" /> Start Protection Plan
        </h2>
        
        <form onSubmit={handleStartSubscription} className="space-y-5 relative z-10">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Full Legal Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Evan" className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">City Location</label>
              <div className="relative mt-1 flex gap-2">
                <div className="relative flex-grow">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input type="text" name="city" value={form.city} onChange={handleCityChange} onFocus={() => form.city.trim() && setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)} required placeholder="Search city via OSM..." className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                   {showDropdown && filteredCities.length > 0 && (
                     <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                       {filteredCities.map((c, idx) => {
                          const matchIndex = c.toLowerCase().indexOf(form.city.toLowerCase());
                          if (matchIndex === -1) return <div key={idx} onClick={() => selectCity(c)} className="cursor-pointer px-4 py-3 hover:bg-indigo-50 font-medium text-gray-700">{c}</div>;
                          const before = c.substring(0, matchIndex);
                          const match = c.substring(matchIndex, matchIndex + form.city.length);
                          const after = c.substring(matchIndex + form.city.length);
                          return (
                             <div key={idx} onClick={() => selectCity(c)} className="cursor-pointer px-4 py-3 hover:bg-slate-100 text-gray-700 transition duration-150">
                                {before}<span className="font-extrabold text-indigo-600">{match}</span>{after}
                             </div>
                          );
                       })}
                     </div>
                   )}
                </div>
                <button type="button" onClick={handleGetLocation} className="px-4 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition flex items-center justify-center">
                   {locLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Map className="w-5 h-5" />}
                </button>
              </div>

              {loadingPreview && (
                 <div className="mt-3 p-4 border border-indigo-100 rounded-xl bg-indigo-50/50 flex items-center justify-center gap-3 animate-pulse">
                     <Activity className="w-4 h-4 text-indigo-500 animate-spin" />
                     <span className="text-sm font-semibold text-indigo-800">Analyzing Regional Risk Models...</span>
                 </div>
              )}
              {previewPolicy && !loadingPreview && (
                 <div className="mt-3 p-4 border border-indigo-100 rounded-xl bg-gradient-to-r from-indigo-50 to-white shadow-sm flex flex-col gap-2 animate-fade-in-up">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Live Prediction Preview</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize"><CloudRain className="w-3 h-3 inline mr-1 -mt-0.5" />{previewPolicy.breakdown.weather}</span>
                    </div>
                    <div className="flex justify-between items-baseline mt-1">
                        <div className="text-sm font-medium text-gray-600">Risk Propensity: <span className="font-extrabold text-gray-900 border-b border-gray-300">{(previewPolicy.risk_probability * 100).toFixed(1)}%</span></div>
                        <div className="text-sm font-medium text-gray-600">Premium Est: <span className="font-extrabold text-green-600">₹{previewPolicy.premium.toFixed(2)}</span></div>
                    </div>
                 </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Weekly Income</label>
              <div className="relative mt-1">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" name="income" value={form.income} onChange={handleChange} required min="0" placeholder="1000" className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex justify-between items-center cursor-pointer" onClick={handleToggle}>
              <div><span className="block text-sm font-bold">Active Loan</span><span className="text-xs text-gray-400">Prior default</span></div>
              <button type="button" className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.loan ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${form.loan ? 'translate-x-5' : 'translate-x-1'} mt-0.5`} />
              </button>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Past Claims</label>
              <input type="number" name="claims" value={form.claims} onChange={handleChange} min="0" placeholder="0" className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Link Payout Account (UPI ID)</label>
            <div className="relative mt-1">
              <input type="text" name="payoutAccount" value={form.payoutAccount} onChange={handleChange} required placeholder="user@upi" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>
          </div>

          <button type="button" onClick={(e) => {
            if (!form.name || !form.city || !form.income || !form.payoutAccount) {
               setError("Please fill all required fields, including Payout Account.");
               return;
            }
            handleStartSubscription(e);
          }} disabled={loading} className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
            {loading ? <Activity className="animate-spin w-5 h-5" /> : "Deploy Smart Contract"}
          </button>
          
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-semibold">{error}</div>}
        </form>
      </div>
    </div>
  );

  const renderDashboardView = () => {
    if (!dashboard) return null;
    const { user_summary, insurance_details, activity, risk_monitoring, claim } = dashboard;
    
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
        
        {/* Top Navigation Strip */}
        <div className="flex flex-wrap items-center justify-between mb-8 bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-xl border-2 border-indigo-200">
               {user_summary.name.charAt(0).toUpperCase()}
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-900">{user_summary.name}</h2>
               <div className="flex items-center text-sm text-gray-500 gap-2">
                 <MapPin className="w-3 h-3" /> {user_summary.city} • <IndianRupee className="w-3 h-3" /> {user_summary.weekly_income}/wk
               </div>
             </div>
          </div>
          
          <div className="flex gap-3 mt-4 sm:mt-0">
             <button onClick={handleAddMoney} disabled={loading} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm">
               <Plus className="w-4 h-4 text-green-600" /> Add Funds
             </button>
             <button onClick={handleSimulateWeek} disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-200 group">
               <Calendar className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Simulate 1 Week
             </button>
          </div>
        </div>

        {/* Dynamic Claim Analysis Header */}
        {claim && (
          <div className={`p-6 rounded-2xl shadow-xl border mb-8 flex items-center justify-between text-white animate-fade-in-up ${claim.status === 'Approved' ? 'bg-gradient-to-r from-emerald-500 to-green-600 border-green-400 shadow-green-200' : 'bg-gradient-to-r from-gray-700 to-gray-900 border-gray-600 shadow-gray-300'}`}>
             <div className="flex items-center gap-4">
               <div className="p-3 bg-white/20 rounded-full">
                 {claim.status === 'Approved' ? <CheckCircle className="w-8 h-8" /> : <AlertOctagon className="w-8 h-8" />}
               </div>
               <div>
                  <h3 className="font-bold text-xl uppercase tracking-wide">Claim Resolution: {claim.status}</h3>
                  <p className="text-white/80 font-medium mt-1">Validation Engine: {claim.reason}</p>
                  {claim.weather && (
                     <p className="text-white/60 font-semibold text-xs mt-1 uppercase tracking-widest"><CloudRain className="w-3 h-3 inline mr-1 -mt-0.5" />Weather Matrix: {claim.weather}</p>
                  )}
               </div>
             </div>
             {claim.status === 'Approved' && (
               <div className="text-right">
                  <span className="block text-green-100 text-sm font-bold uppercase tracking-widest">Remitted Payout Amount</span>
                  <span className="text-4xl font-black">₹{claim.amount.toFixed(2)}</span>
               </div>
             )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Analytics Hub - Left Col */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Policy Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0"></div>
               <div className="flex items-center gap-3 mb-6 relative z-10">
                 <ShieldCheck className="w-6 h-6 text-indigo-500" />
                 <h3 className="text-lg font-bold text-gray-800">Active Insurance Policy</h3>
                 <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full ring-1 ring-green-200">Active protection</span>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 relative z-10">
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Weekly Premium</span>
                   <div className="text-2xl font-black text-gray-900 mt-1">₹{insurance_details.premium.toFixed(2)}</div>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Guaranteed Payout</span>
                   <div className="text-2xl font-black text-indigo-600 mt-1">₹{insurance_details.breakdown.payout.toFixed(2)}</div>
                 </div>
                 <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 col-span-2 md:col-span-1">
                   <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Risk Propensity</span>
                   <div className="text-2xl font-black text-indigo-700 mt-1">{(insurance_details.risk_probability * 100).toFixed(1)}%</div>
                 </div>
               </div>

               <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4 mt-2 mb-4">
                  <span className="flex items-center gap-2 text-xs font-semibold text-indigo-500"><Zap className="w-4 h-4" /> {insurance_details.explanation}</span>
               </div>
               <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                  <span className="flex items-center gap-2"><Map className="w-4 h-4 text-gray-400" /> Machine Learning Tier {insurance_details.breakdown.location_risk} Location</span>
                  <span>Contract auto-renews dynamically</span>
               </div>
            </div>

            {/* Transaction Ledger */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                 <History className="w-6 h-6 text-gray-400" />
                 <h3 className="text-lg font-bold text-gray-800">Recent Transactions</h3>
               </div>
               
               {activity.transactions.length === 0 ? (
                 <div className="py-8 text-center text-sm font-medium text-gray-400">No transactions recorded yet. Click 'Simulate 1 Week'</div>
               ) : (
                 <div className="space-y-3">
                   {[...activity.transactions].reverse().map((tx, i) => (
                     <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100/50 hover:bg-gray-100 transition-colors">
                       <div className="flex items-center gap-4">
                         <div className={`w-2 h-2 rounded-full ${tx.type === 'CREDIT' ? 'bg-green-500' : tx.type === 'FAILED' ? 'bg-red-500' : 'bg-rose-500'}`}></div>
                         <div>
                           <p className="font-bold text-gray-800 text-sm">{tx.desc}</p>
                           <p className="text-xs font-medium text-gray-400">{tx.date}</p>
                         </div>
                       </div>
                       <div className={`font-black tracking-tight ${tx.type === 'CREDIT' ? 'text-green-600' : tx.type === 'FAILED' ? 'text-red-600 line-through' : 'text-gray-900'}`}>
                         {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

          {/* Right Col Hub */}
          <div className="space-y-8">
            
            {/* Wallet Integration Card */}
            <div className="bg-gradient-to-tr from-gray-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl shadow-indigo-900/20 relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
               <div className="flex items-center gap-2 mb-2 text-indigo-200">
                 <Wallet className="w-5 h-5" />
                 <span className="font-bold text-xs uppercase tracking-widest">Platform Wallet</span>
               </div>
               <div className="text-5xl font-black tracking-tighter mb-4">₹{activity.wallet_balance.toFixed(2)}</div>
               
               <div className="flex items-center justify-between text-xs font-medium text-indigo-200 mt-6 pt-4 border-t border-white/10">
                 <span>Auto-debit active</span>
                 <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Linked</span>
               </div>
            </div>

            {/* Smart Claim Engine Action Button */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative text-center">
              <h3 className="font-bold text-gray-800 mb-2">Claim Validation Engine</h3>
              <p className="text-sm text-gray-500 mb-5">Instantly check Weather APIs and SERP News Intel to securely process smart claims.</p>
              <button onClick={handleFileClaim} disabled={loading} className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all shadow-lg flex justify-center items-center gap-2 focus:ring-4 focus:ring-violet-200 disabled:opacity-50">
                 <FileText className="w-5 h-5" /> File Intelligent Claim
              </button>
            </div>

            {/* Environment Monitroing Card */}
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm relative">
                 <div className="flex items-center gap-3 mb-6">
                 <Zap className="w-5 h-5 text-rose-500" />
                 <h3 className="text-lg font-bold text-gray-800">Live External Feeds - {user_summary.city}</h3>
               </div>
               
               <div className="space-y-4">
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center group cursor-default">
                    <div className="flex items-center gap-3"><CloudRain className="w-5 h-5 text-sky-500" /><span className="font-semibold text-sm text-gray-700">Weather API ({user_summary.city})</span></div>
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-gray-900 capitalize">{risk_monitoring.current_weather}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${risk_monitoring.weather_alert === 'Risky' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {risk_monitoring.weather_alert || 'Normal'}
                        </span>
                    </div>
                 </div>
                 
                 <div className={`p-4 rounded-2xl border flex justify-between items-center ${risk_monitoring.serp_status === 'Critical Zone' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-3"><AlertTriangle className={`w-5 h-5 ${risk_monitoring.serp_status === 'Critical Zone' ? 'text-red-500' : 'text-green-600'}`} /><span className="font-semibold text-sm text-gray-700">SERP News Intel ({user_summary.city})</span></div>
                    <span className={`font-bold text-sm ${risk_monitoring.serp_status === 'Critical Zone' ? 'text-red-600 animate-pulse' : 'text-green-700'}`}>
                      {risk_monitoring.serp_status || 'Safe'}
                    </span>
                 </div>
               </div>
               
               <p className="text-xs text-center text-gray-400 mt-5 leading-relaxed font-medium">Validation requires checking both matrix boundaries dynamically.</p>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 relative selection:bg-indigo-200 selection:text-indigo-900 font-sans">
      <div className="absolute top-0 w-full h-[30vh] bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none"></div>
      
      {loading && view === 'dashboard' && (
        <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
           <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-indigo-100 flex items-center gap-4 animate-fade-in-up border border-indigo-50">
             <Activity className="w-6 h-6 text-indigo-600 animate-spin" />
             <span className="font-bold text-indigo-900">Synchronizing Validation Servers...</span>
           </div>
        </div>
      )}

      {view === 'register' && renderRegistrationView()}
      {view === 'dashboard' && renderDashboardView()}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        @keyframes shake { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-3px); } 50% { transform: translateY(3px); } 75% { transform: translateY(-3px); } }
        .animate-shake { animation: shake 0.6s ease-in-out; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}} />
    </div>
  );
}

export default App;
