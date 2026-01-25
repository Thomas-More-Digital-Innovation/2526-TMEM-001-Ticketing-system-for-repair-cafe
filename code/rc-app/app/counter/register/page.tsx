'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '../../components/BackButton';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';
import Button from '../../components/Button';
import ProtectedRoute from '../../components/ProtectedRoute';
import { registerVoorwerp } from '@/lib/actions/voorwerpen';

export default function RegisterItemPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerType: '',
    problemDescription: '',
    itemDescription: '',
    departmentId: ''
  });
  const [departments, setDepartments] = useState<Array<{ value: string; label: string }>>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [customerTypes, setCustomerTypes] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    // Fetch klant types using server action
    const fetchKlantTypes = async () => {
      try {
        const { getKlantTypesForClient } = await import('@/lib/actions/klantTypes');
        const data = await getKlantTypesForClient();
        const options = data.map((t: any) => ({
          value: t.klantTypeId.toString(),
          label: t.naam,
        }));
        setCustomerTypes(options);
        if (options.length > 0) {
          setFormData(prev => prev.customerType ? prev : ({ ...prev, customerType: options[0].value }));
        }
      } catch (err) {
        console.error('Error fetching klant types:', err);
      }
    };
    fetchKlantTypes();
  }, []);

  useEffect(() => {
    // Fetch departments using server action
    const fetchDepartments = async () => {
      try {
        const { getAfdelingenForClient } = await import('@/lib/actions/afdelingen');
        const data = await getAfdelingenForClient();
        const deptOptions = data.map((dept: any) => ({
          value: dept.afdelingId.toString(),
          label: dept.naam
        }));
        setDepartments(deptOptions);
        if (deptOptions.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: deptOptions[0].value }));
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Trim input fields to avoid accidental whitespace-only values
      const payload = {
        ...formData,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone?.trim() || '',
        customerType: formData.customerType?.trim() || '',
        problemDescription: formData.problemDescription.trim(),
        itemDescription: formData.itemDescription.trim(),
      }

      const result = await registerVoorwerp(payload);

      if (!result.success) {
        setError(result.error || 'Er is een fout opgetreden');
        setIsLoading(false);
        return;
      }

        if (result.warning) {
          // Display warning to user and stop so staff can review
          setError(result.warning)
          setIsLoading(false)
          return
        }
      // Success - redirect to confirmation page with tracking number
      localStorage.setItem('registeredItem', JSON.stringify(result.voorwerp));
      const trackingNumber = result.trackingNumber || result.voorwerp?.volgnummer || 'XXXX';
      if (result.trackingNumber) {
        localStorage.setItem('trackingNumber', result.trackingNumber);
      }
      router.push(`/counter/register/confirm?volgnummer=${trackingNumber}`);
    } catch (err) {
      console.error('Register error:', err);
      setError('Er is een fout opgetreden. Probeer het opnieuw.');
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['Admin', 'Balie']}>
      <div className="min-h-screen bg-[#03091C] flex flex-col p-2.5 lg:p-5">
        {/* Header */}
        <div className="flex items-center justify-between p-2.5 mb-5">
          <BackButton />
          <h1 className="text-white font-open-sans text-3xl lg:text-4xl font-normal">
            Nieuw voorwerp registreren
          </h1>
          <div className="w-[100px]" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-2.5 lg:mx-10 mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-2.5 px-2.5 lg:px-10">
        <div className="flex flex-col lg:flex-row gap-2.5 flex-1">
          {/* Customer Information */}
          <div className="flex-1 flex flex-col gap-2.5 p-2.5 border-b lg:border-b-0 lg:border-r border-white/50">
            <h2 className="text-white font-open-sans text-3xl lg:text-4xl font-normal text-center">
              Klantgegevens
            </h2>
            <div className="flex flex-col gap-8">
              <Input
                label="Klant Naam"
                placeholder="Johan Klaasen"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
              <Input
                label="Klant Telefoon Nummer"
                placeholder="+32123456778"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                disabled={isLoading}
              />
              <Dropdown
                options={customerTypes}
                placeholder="Kies een klanttype"
                value={formData.customerType}
                onChange={(value) => setFormData({ ...formData, customerType: value })}
              />
              <Dropdown
                options={departments}
                placeholder="Kies een afdeling"
                value={formData.departmentId}
                onChange={(value) => setFormData({ ...formData, departmentId: value })}
              />
            </div>
          </div>

          {/* Item Information */}
          <div className="flex-1 flex flex-col gap-2.5 p-2.5">
            <h2 className="text-white font-open-sans text-3xl lg:text-4xl font-normal text-center">
              Voorwerpgegevens
            </h2>
            <div className="flex flex-col gap-2.5">
              <Input
                label="Beschrijving Probleem"
                placeholder="Het apparaat is kapot"
                required
                multiline
                rows={6}
                value={formData.problemDescription}
                onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                disabled={isLoading}
              />
              <Input
                label="Beschrijving Voorwerp"
                placeholder="Een rekenmachine op zonnepanelen"
                required
                multiline
                rows={6}
                value={formData.itemDescription}
                onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center p-2.5">
          <Button variant="primary" type="submit" className="w-full lg:w-[572px] px-8 py-4 text-2xl" disabled={isLoading}>
            {isLoading ? 'Bezig met registreren...' : 'Voorwerp Registreren'}
          </Button>
        </div>
      </form>
    </div>
    </ProtectedRoute>
  );
}
