import { useState, useEffect, FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { SaleItem } from '../types/SaleItem';
import toast from 'react-hot-toast';

interface AddSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (sale: SaleItem) => void;
    initialData?: SaleItem | null;
}

const AddSaleModal = ({ isOpen, onClose, onAdd, initialData }: AddSaleModalProps) => {
    const [formData, setFormData] = useState<SaleItem>({
        date: new Date().toISOString(),
        customerName: '',
        type: 'Wordpress',
        assetName: '',
        envatoLink: '',
        price: 0,
    });

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
                setSelectedDate(new Date(initialData.date));
            } else {
                // Reset form for new sale
                setFormData({
                    date: new Date().toISOString(),
                    customerName: '',
                    type: 'Wordpress',
                    assetName: '',
                    envatoLink: '',
                    price: 0,
                });
                setSelectedDate(new Date());
            }
        }
    }, [isOpen, initialData]);



    // ... (imports)

    // ... (component)

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.customerName || !formData.assetName || formData.price <= 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        onAdd({
            ...formData,
            date: selectedDate.toISOString(),
        });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content w-full max-w-2xl">
                <div className="glass-card rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                            {initialData ? 'Edit Sale' : 'Add New Sale'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Date Picker */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date: Date | null) => date && setSelectedDate(date)}
                                className="input-field"
                                dateFormat="yyyy-MM-dd"
                                icon={undefined}
                            />
                        </div>

                        {/* Customer Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                className="input-field"
                                placeholder="Enter customer name"
                                required
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="input-field"
                            >
                                <option value="Wordpress">Wordpress</option>
                                <option value="Web Template">Web Template</option>
                                <option value="Plugin">Plugin</option>
                                <option value="Theme">Theme</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Asset Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Asset Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.assetName}
                                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                                className="input-field"
                                placeholder="Enter asset/product name"
                                required
                            />
                        </div>

                        {/* Envato Link */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Envato Link
                            </label>
                            <input
                                type="url"
                                value={formData.envatoLink}
                                onChange={(e) => setFormData({ ...formData, envatoLink: e.target.value })}
                                className="input-field"
                                placeholder="https://elements.envato.com/..."
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Price (USD) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                className="input-field"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="btn-primary flex-1">
                                {initialData ? 'Update Sale' : 'Add Sale'}
                            </button>
                            <button type="button" onClick={onClose} className="btn-secondary flex-1">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AddSaleModal;
