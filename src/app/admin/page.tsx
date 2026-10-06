import { notFound } from 'next/navigation'

// صفحة /admin ممنوعة تمامًا — الدخول بيكون بالطريقة السرية من الصفحة الرئيسية فقط
export default function AdminPage() {
  notFound()
}
