import { useState, ChangeEvent } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import { SaleItem } from '../types/SaleItem';
import toast from 'react-hot-toast';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}



const ImportModal = ({ isOpen, onClose, onImportComplete }: ImportModalProps) => {
    const [parsedData, setParsedData] = useState<SaleItem[]>([]);
    const [previewData, setPreviewData] = useState<SaleItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importResult, setImportResult] = useState<{
        success: boolean;
        imported: number;
        failed: number;
        errors: string[];
    } | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            parseCSV(selectedFile);
        }
    };

    const parseDate = (dateString: string): string => {
        if (!dateString || dateString.trim() === '') {
            return new Date().toISOString();
        }

        // Clean the date string
        const cleanedDate = dateString.trim();

        // Try to detect DD/MM/YYYY or DD-MM-YYYY format first (common in Excel)
        const ddmmyyyyPattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
        const match = cleanedDate.match(ddmmyyyyPattern);

        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);

            // Check if it's likely DD/MM/YYYY (day > 12 or month <= 12)
            // If day > 12, it must be DD/MM/YYYY
            // If day <= 12 and month <= 12, assume DD/MM/YYYY for consistency
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                // Create date as YYYY-MM-DD (ISO format)
                const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const parsed = new Date(isoDate);

                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString();
                }
            }
        }

        // Try ISO format (YYYY-MM-DD)
        const isoPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
        const isoMatch = cleanedDate.match(isoPattern);
        if (isoMatch) {
            const parsed = new Date(cleanedDate);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString();
            }
        }

        // Try standard Date parsing as last resort
        const parsed = new Date(cleanedDate);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
        }

        // Fallback to current date if all parsing fails
        console.warn(`Could not parse date: ${dateString}, using current date`);
        return new Date().toISOString();
    };

    const parseCSV = (file: File) => {
        Papa.parse<any>(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(), // Handle headers with spaces like "Name "
            complete: (results) => {
                const mapped = results.data.map((row: any): SaleItem => {
                    // Flexible column mapping
                    const name = row.Name || row.Customer || row.Client || row['Customer Name'] || 'Unknown Customer';
                    const type = row.Type || row.Category || 'Other';
                    const asset = row.Asset || row.Product || row.Item || 'Unknown Asset';
                    const link = row.Link || row.Url || row.EnvatoLink || '';
                    const priceStr = row.Price || row.Amount || row.Cost || '0';

                    return {
                        date: parseDate(row.Date || row.DateAdded || row.Created),
                        customerName: name.trim(),
                        type: type.trim(),
                        assetName: asset.trim(),
                        envatoLink: link.trim(),
                        price: parseFloat(priceStr.replace(/[^0-9.-]+/g, '')) || 0, // Handle currency symbols like $100.00
                    };
                });

                setParsedData(mapped);
                setPreviewData(mapped.slice(0, 10)); // Show first 10 rows
            },
            error: (error) => {
                toast.error(`Error parsing CSV: ${error.message}`);
            },
        });
    };

    const handleImport = async () => {
        if (parsedData.length === 0) {
            toast.error('No data to import');
            return;
        }

        setIsProcessing(true);
        setImportResult(null);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const response = await axios.post(`${API_BASE_URL}/sales/bulk`, parsedData);
            setImportResult(response.data);

            if (response.data.success) {
                toast.success(`Successfully imported ${response.data.imported} records`);
                setTimeout(() => {
                    onImportComplete();
                    handleClose();
                }, 2000);
            }
        } catch (error) {
            toast.error('Error importing data. Please try again.');
            console.error('Import error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setParsedData([]);
        setPreviewData([]);
        setImportResult(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-backdrop" onClick={handleClose}></div>
            <div className="modal-content w-full max-w-5xl">
                <div className="glass-card rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                            Import Sales from CSV
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
                        >
                            ×
                        </button>
                    </div>

                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Select CSV File
                        </label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="input-field"
                        />
                        <p className="text-sm text-slate-500 mt-2">
                            Expected format: Date,Name,Type,Asset,Link,Price
                        </p>
                    </div>

                    {/* Preview Table */}
                    {previewData.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-700 mb-3">
                                Preview ({parsedData.length} records total, showing first 10)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Date</th>
                                            <th className="px-4 py-2 text-left">Customer</th>
                                            <th className="px-4 py-2 text-left">Type</th>
                                            <th className="px-4 py-2 text-left">Asset</th>
                                            <th className="px-4 py-2 text-left">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((item, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="px-4 py-2">{new Date(item.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-2">{item.customerName}</td>
                                                <td className="px-4 py-2">{item.type}</td>
                                                <td className="px-4 py-2">{item.assetName}</td>
                                                <td className="px-4 py-2">${item.price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Import Result */}
                    {importResult && (
                        <div className={`mb-6 p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <h3 className="font-semibold mb-2">Import Results</h3>
                            <p>Successfully imported: {importResult.imported} records</p>
                            {importResult.failed > 0 && (
                                <>
                                    <p className="text-red-600">Failed: {importResult.failed} records</p>
                                    {importResult.errors.length > 0 && (
                                        <ul className="mt-2 text-sm text-red-600">
                                            {importResult.errors.slice(0, 5).map((error, index) => (
                                                <li key={index}>• {error}</li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleImport}
                            disabled={parsedData.length === 0 || isProcessing}
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Importing...' : `Import ${parsedData.length} Records`}
                        </button>
                        <button
                            onClick={handleClose}
                            className="btn-secondary flex-1"
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ImportModal;
