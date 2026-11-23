import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Phone,
  Receipt,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  MOMO_MERCHANT_NAME,
  MOMO_MERCHANT_NUMBER,
  PAYMENT_PLANS,
} from '../data/seedData';
import { MoMoNetwork, PlanId, SubscriptionRecord } from '../types/studymate';

interface PlansCheckoutViewProps {
  subscriptions: SubscriptionRecord[];
  activeSubscription: SubscriptionRecord | null;
  onActivatePlan: (record: Omit<SubscriptionRecord, 'id' | 'purchasedAt' | 'expiresAt' | 'status'>) => void;
}

const NETWORKS: { id: MoMoNetwork; ussd: string }[] = [
  { id: 'MTN Mobile Money', ussd: '*170#' },
  { id: 'Telecel Cash', ussd: '*110#' },
  { id: 'AT Money', ussd: '*110#' },
];

export function PlansCheckoutView({
  subscriptions,
  activeSubscription,
  onActivatePlan,
}: PlansCheckoutViewProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('monthly');
  const [hoursCount, setHoursCount] = useState<number>(2);
  const [network, setNetwork] = useState<MoMoNetwork>('MTN Mobile Money');
  const [payerNumber, setPayerNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationMsg, setConfirmationMsg] = useState<string | null>(null);

  // Study Group Cost-Split Calculator ("and add more")
  const [splitPlanId, setSplitPlanId] = useState<PlanId>('monthly');
  const [splitMembers, setSplitMembers] = useState<number>(5);

  const selectedPlan = PAYMENT_PLANS.find((p) => p.id === selectedPlanId) || PAYMENT_PLANS[1];
  const totalAmountGhs =
    selectedPlanId === 'hourly' ? selectedPlan.priceGhs * hoursCount : selectedPlan.priceGhs;

  const referenceCode = useMemo(() => {
    const prefix = selectedPlanId === 'hourly' ? 'SMH' : selectedPlanId === 'monthly' ? 'SMM' : 'SMA';
    return `${prefix}-${String(totalAmountGhs).padStart(3, '0')}`;
  }, [selectedPlanId, totalAmountGhs]);

  const splitBaseAmount =
    splitPlanId === 'hourly' ? 10 * hoursCount : splitPlanId === 'monthly' ? 100 : 1000;
  const costPerStudent = (splitBaseAmount / Math.max(1, splitMembers)).toFixed(2);

  const selectedNetworkUssd =
    NETWORKS.find((n) => n.id === network)?.ussd || '*170#';

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(MOMO_MERCHANT_NUMBER);
    } catch {
      // Fallback ignored; visual state still confirms
    }
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConfirmationMsg(null);

    const cleanPhone = payerNumber.replace(/\s+/g, '');
    if (!/^0\d{9}$/.test(cleanPhone)) {
      setFormError('Enter a valid 10-digit Ghana Mobile Money number (e.g. 024XXXXXXX).');
      return;
    }
    if (transactionId.trim().length < 6) {
      setFormError('Enter the Mobile Money Transaction ID from your SMS confirmation.');
      return;
    }

    onActivatePlan({
      planId: selectedPlan.id,
      planName:
        selectedPlan.id === 'hourly'
          ? `${selectedPlan.name} (${hoursCount} hr${hoursCount > 1 ? 's' : ''})`
          : selectedPlan.name,
      amountGhs: totalAmountGhs,
      hoursPurchased: selectedPlan.id === 'hourly' ? hoursCount : undefined,
      network,
      payerNumber: cleanPhone,
      recipientNumber: MOMO_MERCHANT_NUMBER,
      referenceCode,
      transactionId: transactionId.trim().toUpperCase(),
    });

    setConfirmationMsg(
      `Activated ${selectedPlan.name} (GH₵ ${totalAmountGhs.toLocaleString()}) sent to ${MOMO_MERCHANT_NUMBER}.`,
    );
    setPayerNumber('');
    setTransactionId('');
  };

  const handleDownloadReceipt = (sub: SubscriptionRecord) => {
    const content = [
      'STUDYMATE GHANA — PAYMENT RECEIPT',
      '===================================',
      `Receipt ID:       ${sub.id}`,
      `Plan:             ${sub.planName}`,
      `Amount Paid:      GH₵ ${sub.amountGhs.toLocaleString()}`,
      `Recipient MoMo:   ${sub.recipientNumber} (${MOMO_MERCHANT_NAME})`,
      `Payer MoMo:       ${sub.payerNumber} (${sub.network})`,
      `Reference Code:   ${sub.referenceCode}`,
      `Transaction ID:   ${sub.transactionId}`,
      `Activated At:     ${new Date(sub.purchasedAt).toLocaleString()}`,
      `Valid Until:      ${new Date(sub.expiresAt).toLocaleString()}`,
      `Status:           ${sub.status}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studymate-receipt-${sub.transactionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Header + Merchant Number Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Study Plans & Mobile Money Checkout
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Transparent Ghana Cedi pricing for JHS, SHS, and University learners: GH₵ 10/hour,
            GH₵ 100/month, or GH₵ 1,000/year.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
          <Phone className="w-4 h-4 text-blue-700 shrink-0" />
          <div className="text-xs">
            <p className="text-slate-500">Official MoMo Number</p>
            <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {MOMO_MERCHANT_NUMBER}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyNumber}
            className="ml-2 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedNumber ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Active Subscription Status (if active) */}
      {activeSubscription && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Active Subscription · {activeSubscription.status}</span>
            </div>
            <p className="font-display text-lg font-bold text-slate-900">
              {activeSubscription.planName} — GH₵ {activeSubscription.amountGhs.toLocaleString()}
            </p>
            <p className="text-xs text-slate-600 tabular-nums">
              Paid via {activeSubscription.network} ({activeSubscription.payerNumber}) to{' '}
              <span className="font-mono font-semibold">{activeSubscription.recipientNumber}</span> ·
              Valid until {new Date(activeSubscription.expiresAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadReceipt(activeSubscription)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Receipt</span>
          </button>
        </div>
      )}

      {/* 3-Column Pricing Grid */}
      <section aria-label="StudyMate pricing plans" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PAYMENT_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl p-6 flex flex-col justify-between transition-colors ${
                isSelected
                  ? 'border-2 border-blue-700'
                  : 'border border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-slate-500">{plan.audienceLabel}</span>
                  {plan.recommended && (
                    <span className="font-semibold text-blue-700">Most Popular</span>
                  )}
                </div>

                <h2 className="font-display text-xl font-bold text-slate-900">{plan.name}</h2>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                    GH₵ {plan.priceGhs.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">
                    {plan.id === 'hourly'
                      ? '/ hour'
                      : plan.id === 'monthly'
                        ? '/ month'
                        : '/ year'}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{plan.summary}</p>

                {plan.id === 'hourly' && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Hours to buy:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlanId('hourly');
                          setHoursCount((h) => Math.max(1, h - 1));
                        }}
                        className="w-7 h-7 rounded-md bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        aria-label="Decrease hours"
                      >
                        −
                      </button>
                      <span className="font-mono text-sm font-semibold text-slate-900 w-10 text-center tabular-nums">
                        {hoursCount}h
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlanId('hourly');
                          setHoursCount((h) => Math.min(24, h + 1));
                        }}
                        className="w-7 h-7 rounded-md bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        aria-label="Increase hours"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <ul className="mt-5 space-y-2.5 text-sm text-slate-700 border-t border-slate-100 pt-5">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`mt-6 w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-700 text-white hover:bg-blue-800'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {isSelected
                  ? `Selected · GH₵ ${(plan.id === 'hourly' ? plan.priceGhs * hoursCount : plan.priceGhs).toLocaleString()}`
                  : `Select ${plan.name}`}
              </button>
            </div>
          );
        })}
      </section>

      {/* Mobile Money Payment Terminal + Study Group Split Calculator */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive MoMo Checkout */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Complete Payment via Mobile Money
              </h2>
              <p className="text-xs text-slate-500">
                Send exact amount to <strong className="font-mono">{MOMO_MERCHANT_NUMBER}</strong>{' '}
                and confirm your transaction ID below.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Due</p>
              <p className="font-display text-2xl font-bold text-blue-700 tabular-nums">
                GH₵ {totalAmountGhs.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Network Tabs */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700">1. Choose MoMo Network</span>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {NETWORKS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNetwork(n.id)}
                  className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    network === n.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {n.id}
                </button>
              ))}
            </div>
          </div>

          {/* Step-by-Step Transfer Instructions */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-sm">
            <p className="text-xs font-semibold text-slate-800">
              2. Transfer Instructions ({network})
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <li>
                Dial <span className="font-mono font-semibold text-slate-900">{selectedNetworkUssd}</span>{' '}
                or open your {network} app and select <strong>Transfer Money → MoMo User</strong>.
              </li>
              <li>
                Enter recipient number:{' '}
                <span className="font-mono font-bold text-slate-900">{MOMO_MERCHANT_NUMBER}</span>
              </li>
              <li>
                Enter exact amount:{' '}
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  GH₵ {totalAmountGhs.toLocaleString()}
                </span>
              </li>
              <li>
                Use reference code:{' '}
                <span className="font-mono font-bold text-blue-700">{referenceCode}</span>
              </li>
            </ol>
          </div>

          {/* Confirmation Form */}
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <p className="text-xs font-semibold text-slate-700">
              3. Confirm Your MoMo Transaction
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Your MoMo Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={payerNumber}
                  onChange={(e) => setPayerNumber(e.target.value)}
                  placeholder="024XXXXXXX"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  SMS Transaction ID
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. TXN84920144"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            {confirmationMsg && (
              <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {confirmationMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              Verify & Activate {selectedPlan.name} (GH₵ {totalAmountGhs.toLocaleString()})
            </button>
          </form>
        </div>

        {/* Right: Plan Comparison + Study Group Cost-Split Calculator */}
        <div className="lg:col-span-5 space-y-6">
          {/* Group Cost Split Calculator */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <h2 className="font-display text-lg font-bold text-slate-900">
                Study Group Cost-Split Calculator
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sharing a study circle with classmates? Calculate how much each student contributes
              when splitting a group plan to <span className="font-mono">{MOMO_MERCHANT_NUMBER}</span>.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Plan to Split
                </label>
                <select
                  value={splitPlanId}
                  onChange={(e) => setSplitPlanId(e.target.value as PlanId)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  <option value="hourly">Hourly ({hoursCount}h · GH₵ {10 * hoursCount})</option>
                  <option value="monthly">Monthly (GH₵ 100)</option>
                  <option value="annual">Annual (GH₵ 1,000)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Group Members ({splitMembers})
                </label>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={splitMembers}
                  onChange={(e) => setSplitMembers(Number(e.target.value))}
                  className="w-full mt-2 accent-blue-700"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Contribution per student:</span>
              <span className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                GH₵ {costPerStudent}
              </span>
            </div>
          </div>

          {/* Concrete Plan Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Plan Limits & Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-medium">Feature</th>
                    <th className="py-2 px-2 font-medium text-right">Hourly</th>
                    <th className="py-2 px-2 font-medium text-right">Monthly</th>
                    <th className="py-2 pl-2 font-medium text-right">Annual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums text-slate-700">
                  <tr>
                    <td className="py-2.5 pr-3 font-medium text-slate-900">Rate (GH₵)</td>
                    <td className="py-2.5 px-2 text-right">10/hr</td>
                    <td className="py-2.5 px-2 text-right">100/mo</td>
                    <td className="py-2.5 pl-2 text-right font-semibold text-blue-700">1,000/yr</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">Flashcard Decks</td>
                    <td className="py-2.5 px-2 text-right">Unlimited</td>
                    <td className="py-2.5 px-2 text-right">Unlimited</td>
                    <td className="py-2.5 pl-2 text-right">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">Hosted Groups</td>
                    <td className="py-2.5 px-2 text-right">1 active</td>
                    <td className="py-2.5 px-2 text-right">10 active</td>
                    <td className="py-2.5 pl-2 text-right">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">Quiz Generator</td>
                    <td className="py-2.5 px-2 text-right">Included</td>
                    <td className="py-2.5 px-2 text-right">Included</td>
                    <td className="py-2.5 pl-2 text-right">Included</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">CSV Progress Export</td>
                    <td className="py-2.5 px-2 text-right">—</td>
                    <td className="py-2.5 px-2 text-right">Included</td>
                    <td className="py-2.5 pl-2 text-right">Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Ledger History */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Payment & Subscription History
            </h2>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {subscriptions.length} transaction{subscriptions.length === 1 ? '' : 's'}
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">
            No Mobile Money activations recorded yet. Select a plan above and send payment to{' '}
            <span className="font-mono font-semibold text-slate-800">{MOMO_MERCHANT_NUMBER}</span>{' '}
            to activate.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">Plan</th>
                  <th className="py-2.5 px-3 font-medium">Network</th>
                  <th className="py-2.5 px-3 font-medium">Payer → Recipient</th>
                  <th className="py-2.5 px-3 font-medium">Transaction ID</th>
                  <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums text-slate-700">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{sub.planName}</td>
                    <td className="py-3 px-3">{sub.network}</td>
                    <td className="py-3 px-3 font-mono">
                      {sub.payerNumber} → {sub.recipientNumber}
                    </td>
                    <td className="py-3 px-3 font-mono">{sub.transactionId}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900">
                      GH₵ {sub.amountGhs.toLocaleString()}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(sub)}
                        className="text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
