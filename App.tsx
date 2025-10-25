import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InvoiceItem, Theme, ThemeCollection } from './types';
import { INITIAL_ITEMS, THEMES } from './constants';
import { extractInvoiceDataFromImage } from './services/geminiService';

// --- Helper & Sub-components ---

interface PriceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (price: number) => void;
    isLoading: boolean;
}

const PriceModal: React.FC<PriceModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [price, setPrice] = useState('80');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const priceValue = parseFloat(price);
        if (!isNaN(priceValue) && priceValue > 0) {
            onSubmit(priceValue);
        } else {
            alert("Please enter a valid price per unit.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-lg font-bold mb-4">Set Price per Tiffin</h2>
                <p className="text-sm text-gray-600 mb-4">Enter the price for a single tiffin. This will be used to calculate the total for each item extracted from your image.</p>
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center border-2 border-gray-200 rounded-lg p-2 focus-within:border-blue-500">
                         <span className="text-gray-500 px-2">₹</span>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full outline-none"
                            placeholder="e.g., 80"
                            autoFocus
                        />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200" disabled={isLoading}>
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 flex items-center" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </>
                            ) : "Extract & Populate"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main App Component ---

function App() {
    const [items, setItems] = useState<InvoiceItem[]>(INITIAL_ITEMS);
    const [clients, setClients] = useState<string[]>([]);
    const [invoiceToName, setInvoiceToName] = useState('Monu');
    const [logo, setLogo] = useState<string>('iconn.png');
    const [amountPaid, setAmountPaid] = useState(0);
    const [taxPercent, setTaxPercent] = useState(0);
    const [currentDate] = useState(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const invoiceContainerRef = useRef<HTMLDivElement>(null);
    const imageUploadRef = useRef<HTMLInputElement>(null);
    const excelUploadRef = useRef<HTMLInputElement>(null);

    // Load clients from localStorage on mount
    useEffect(() => {
        try {
            const storedClients = localStorage.getItem('invoiceClients');
            if (storedClients) {
                setClients(JSON.parse(storedClients));
            }
        } catch (error) {
            console.error("Failed to parse clients from localStorage", error);
        }
    }, []);

    const applyTheme = useCallback((theme: Theme) => {
        const root = document.documentElement;
        if (invoiceContainerRef.current) {
            if (theme.type === 'gradient') {
                invoiceContainerRef.current.style.background = theme.pageBg;
            } else {
                invoiceContainerRef.current.style.background = 'none';
                invoiceContainerRef.current.style.backgroundColor = theme.pageBg;
            }
        }
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--text-color-dark', theme.textDark);
        root.style.setProperty('--text-color-medium', theme.textMedium);
        root.style.setProperty('--text-color-light', theme.textLight);
        root.style.setProperty('--border-color', theme.border);
        root.style.setProperty('--header-bg-color', theme.headerBg);
    }, []);

    useEffect(() => {
      // Apply default theme on initial render
      applyTheme(THEMES.default);
    }, [applyTheme]);


    // --- Calculations ---
    const { totalTiffins, totalAmount, amountDue } = useMemo(() => {
        const totalTiffins = items.reduce((sum, item) => sum + item.qty, 0);
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
        const taxAmount = subtotal * (taxPercent / 100);
        const finalAmount = subtotal + taxAmount;
        const amountDue = finalAmount - amountPaid;
        return { totalTiffins, totalAmount: finalAmount, amountDue };
    }, [items, amountPaid, taxPercent]);

    // --- Handlers ---
    const handleItemChange = (id: string, field: keyof InvoiceItem, value: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                if (field === 'qty' || field === 'price') {
                    return { ...item, [field]: parseFloat(value) || 0 };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };
    
    const handleAmountPaidChange = (value: string) => {
        const numericValue = parseFloat(value.replace('₹', '')) || 0;
        setAmountPaid(numericValue);
    };
    
    const handleTaxChange = (value: string) => {
      const numericValue = parseFloat(value.replace('%', '')) || 0;
      setTaxPercent(numericValue);
    }

    const handleAddItem = () => {
        const newItem: InvoiceItem = { id: uuidv4(), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'}), qty: 1, price: 80 };
        setItems(prev => [...prev, newItem]);
    };
    
    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddClient = () => {
        const name = prompt("Enter new client's name:");
        if (name && name.trim() && !clients.includes(name.trim())) {
            const newClients = [...clients, name.trim()];
            setClients(newClients);
            localStorage.setItem('invoiceClients', JSON.stringify(newClients));
            setInvoiceToName(name.trim());
        }
    };

    const handleSaveClient = () => {
        const name = invoiceToName.trim();
         if (name && !clients.includes(name)) {
            const newClients = [...clients, name];
            setClients(newClients);
            localStorage.setItem('invoiceClients', JSON.stringify(newClients));
            alert(`Client "${name}" saved!`);
        }
    }
    
    const handleDeleteClient = (clientToDelete: string) => {
        if (!clientToDelete) return;
        if (window.confirm(`Are you sure you want to delete client "${clientToDelete}"?`)) {
            const newClients = clients.filter(c => c !== clientToDelete);
            setClients(newClients);
            localStorage.setItem('invoiceClients', JSON.stringify(newClients));
            if (invoiceToName === clientToDelete) {
                setInvoiceToName("Client Name");
            }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedImageFile(e.target.files[0]);
            setIsModalOpen(true);
            e.target.value = ''; // Reset input
        }
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = (window as any).XLSX.read(data, { type: 'array', cellDates: true });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData: unknown = (window as any).XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

                if (!Array.isArray(jsonData)) {
                    throw new Error("Excel sheet data is not in an array format.");
                }

                if (jsonData.length === 0) throw new Error("Excel sheet is empty or invalid.");

                // FIX: Explicitly cast `jsonData` to `any[]` before calling `.map()`.
                // This is necessary because the `Array.isArray` type guard above is not sufficient
                // to prevent the TypeScript error "Property 'map' does not exist on type 'unknown'".
                const newItems: InvoiceItem[] = (jsonData as any[]).map((row: any) => {
                    const dateKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'date');
                    const qtyKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'qty');
                    const priceKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'price');

                    if (!dateKey || !qtyKey || !priceKey) return null;

                    let dateValue = row[dateKey];
                    if (dateValue instanceof Date) {
                        dateValue = dateValue.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    }

                    const qtyValue = parseFloat(String(row[qtyKey]).trim());
                    const priceValue = parseFloat(String(row[priceKey]).replace(/[^0-9.-]+/g,""));

                    if (isNaN(qtyValue) || isNaN(priceValue)) return null;

                    return {
                        id: uuidv4(),
                        date: String(dateValue),
                        qty: qtyValue,
                        price: priceValue
                    };
                }).filter((item: InvoiceItem | null): item is InvoiceItem => item !== null);

                if (newItems.length === 0) {
                    throw new Error("No valid items found. Ensure columns are named DATE, QTY, and PRICE.");
                }

                setItems(newItems);

            } catch (error: any) {
                console.error("Error processing Excel file:", error);
                alert(`Error: ${error.message}`);
            } finally {
                if (e.target) e.target.value = ''; // Reset input
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleExtractData = async (unitPrice: number) => {
        if (!uploadedImageFile) return;

        setIsLoading(true);
        try {
            const extractedData = await extractInvoiceDataFromImage(uploadedImageFile);

            const newItems: InvoiceItem[] = extractedData.map(item => {
                const qty = String(item.quantity)
                    .split('+')
                    .reduce((sum, val) => sum + (parseInt(val.trim(), 10) || 0), 0);

                return {
                    id: uuidv4(),
                    date: item.date,
                    qty: qty,
                    price: qty * unitPrice,
                };
            }).filter(item => item.qty > 0);

            if (newItems.length === 0) {
              throw new Error("AI could not find any valid items in the image.");
            }

            setItems(newItems);
            setIsModalOpen(false);
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
            setUploadedImageFile(null);
        }
    };

    const handleDownloadPdf = () => {
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;

      const invoiceElement = invoiceContainerRef.current;
      if (!invoiceElement) return;

      const filename = `${invoiceToName.trim() || 'invoice'}.pdf`;
      const elementsToHide = invoiceElement.querySelectorAll('.no-print');
      
      elementsToHide.forEach((el: any) => el.style.visibility = 'hidden');
      const originalShadow = invoiceElement.style.boxShadow;
      invoiceElement.style.boxShadow = 'none';

      html2canvas(invoiceElement, { 
          scale: 2.5, 
          useCORS: true,
          backgroundColor: null
      }).then((canvas: HTMLCanvasElement) => {
          const imgData = canvas.toDataURL('image/jpeg', 0.85);
          const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
          pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
          pdf.save(filename);
      }).catch((err: Error) => {
          console.error("Error generating PDF:", err);
      }).finally(() => {
          elementsToHide.forEach((el: any) => el.style.visibility = 'visible');
          invoiceElement.style.boxShadow = originalShadow;
      });
    };

    const getThemeButtonStyle = useCallback((theme: Theme, name: string): React.CSSProperties => {
        const themeNames = Object.keys(THEMES);
        const index = themeNames.indexOf(name);
        const style: React.CSSProperties = {};

        if (index >= 0 && index < 4) { // Basic
            style.backgroundColor = theme.primary;
        } else if (index >= 4 && index < 8) { // Premium
            style.backgroundColor = theme.pageBg;
        } else if (index >= 8 && index < 12) { // Professional
            if (theme.type === 'gradient') {
                 style.background = theme.pageBg;
            } else {
                 style.backgroundColor = theme.pageBg;
            }
            style.borderColor = theme.primary;
        } else if (index >= 12 && index < 17) { // Curated
            style.backgroundImage = `linear-gradient(to right, ${theme.pageBg} 50%, ${theme.primary} 50%)`;
            style.borderColor = theme.border;
        } else { // Default fallback
            style.background = theme.pageBg;
        }
        return style;
    }, []);

    const themeGroups = useMemo(() => ({
        "Basic": Object.entries(THEMES).slice(0, 4),
        "Premium": Object.entries(THEMES).slice(4, 8),
        "Professional": Object.entries(THEMES).slice(8, 12),
        "Curated": Object.entries(THEMES).slice(12, 17)
    }), []);


    // --- CSS Variables for Theme ---
    const invoiceStyle: React.CSSProperties = {
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        maxWidth: '450px',
        transition: 'background 0.3s ease-in-out, background-color 0.3s ease-in-out',
    };
    
    const dashedBorderStyle = { borderTop: '2px dashed var(--border-color)', transition: 'border-color 0.3s ease-in-out' };
    const textColor1 = { color: 'var(--text-color-dark)', transition: 'color 0.3s ease-in-out' };
    const textColor2 = { color: 'var(--text-color-medium)', transition: 'color 0.3s ease-in-out' };
    const textColor3 = { color: 'var(--text-color-light)', transition: 'color 0.3s ease-in-out' };
    const primaryTextColor = { color: 'var(--primary-color)', transition: 'color 0.3s ease-in-out' };
    const headerBgColor = { backgroundColor: 'var(--header-bg-color)', transition: 'background-color 0.3s ease-in-out' };
    const btnThemed = { backgroundColor: 'var(--primary-color)', transition: 'filter 0.2s ease-in-out, background-color 0.3s ease-in-out' };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <PriceModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              onSubmit={handleExtractData}
              isLoading={isLoading}
            />

            {/* THEME SELECTOR */}
             <div className="mb-6 flex flex-col justify-center items-center space-y-3 no-print p-3 bg-white rounded-lg shadow-sm w-full max-w-md">
                {Object.entries(themeGroups).map(([groupName, themes], index) => (
                    <div key={groupName} className={`w-full flex items-center ${index > 0 ? 'border-t pt-3' : ''}`}>
                        <span className="text-xs font-medium text-gray-500 mr-2 min-w-[70px]">{groupName}:</span>
                        <div className="flex flex-wrap gap-2">
                           {themes.map(([name, theme]) => (
                                <button 
                                    key={name} 
                                    className="w-6 h-6 rounded-full relative transition-transform hover:scale-110 shadow-sm border-2 border-gray-200" 
                                    style={getThemeButtonStyle(theme, name)}
                                    onClick={() => applyTheme(theme)} 
                                    title={name.charAt(0).toUpperCase() + name.slice(1)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>


            {/* CLIENT MANAGER */}
            <div className="mb-4 flex justify-center items-center space-x-2 no-print p-3 bg-white rounded-lg shadow-sm max-w-md w-full">
                <span className="text-sm font-medium text-gray-600">Client:</span>
                <div className="flex items-center space-x-1">
                    <select value={invoiceToName} onChange={(e) => setInvoiceToName(e.target.value)} className="text-sm rounded border-gray-300 shadow-sm text-gray-600 bg-gray-50 p-1">
                        <option value="" disabled>Select Client</option>
                        {clients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={handleAddClient} title="Add New Client"><svg className="w-5 h-5 text-blue-500 hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
                    <button onClick={handleSaveClient} title="Save Current Client"><svg className="w-5 h-5 text-green-500 hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg></button>
                    <button onClick={() => handleDeleteClient(invoiceToName)} title="Delete Selected Client"><svg className="w-5 h-5 text-red-500 hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
            </div>

            {/* INVOICE */}
            <div ref={invoiceContainerRef} style={invoiceStyle} className="bg-white p-8 rounded-lg w-full">
                {/* Header */}
                <header className="flex flex-col items-center mb-10">
                    <div className="relative group">
                        <img src={logo} alt="Company Logo" className="h-[105px] w-[105px] object-contain rounded-full" />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <label htmlFor="logo-upload" className="cursor-pointer text-white text-xs text-center">Change</label>
                            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoChange}/>
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 contentEditable suppressContentEditableWarning className="text-[35px] font-bold" style={primaryTextColor}>Bhookhad Baba</h1>
                        <p contentEditable suppressContentEditableWarning style={textColor3}>Tiffin Service</p>
                    </div>
                </header>
                
                {/* Main */}
                <main>
                     <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold leading-tight" style={textColor1}>Food Service</h2>
                            <h2 className="text-3xl font-bold" style={textColor1}>Bill</h2>
                        </div>
                        <div className="text-right space-y-1" style={textColor2}>
                            <p>Date: <span contentEditable suppressContentEditableWarning>{currentDate}</span></p>
                            <p className="whitespace-nowrap">Invoice to : <span contentEditable suppressContentEditableWarning onBlur={(e) => setInvoiceToName(e.currentTarget.textContent || '')}>{invoiceToName}</span></p>
                            <p>Invoice no : <span contentEditable suppressContentEditableWarning>#0001</span></p>
                        </div>
                    </div>

                    <div style={dashedBorderStyle}></div>

                    {/* Table */}
                    <table className="w-full text-left">
                        <thead>
                            <tr style={headerBgColor}>
                                <th className="font-semibold py-2 w-1/2 pl-2" style={textColor1}>DATE</th>
                                <th className="font-semibold py-2 w-1/4 text-center" style={textColor1}>QTY</th>
                                <th className="font-semibold py-2 w-1/4 text-right pr-2" style={textColor1}>PRICE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id} className="group relative" style={{borderBottom: index === items.length - 1 ? 'none' : `1px solid var(--border-color)`}}>
                                    <td contentEditable suppressContentEditableWarning onBlur={(e) => handleItemChange(item.id, 'date', e.currentTarget.textContent || '')} className="py-2 pl-2">{item.date}</td>
                                    <td contentEditable suppressContentEditableWarning onBlur={(e) => handleItemChange(item.id, 'qty', e.currentTarget.textContent || '0')} className="py-2 text-center">{item.qty}</td>
                                    <td className="py-2 text-right pr-2">
                                        ₹<span contentEditable suppressContentEditableWarning onBlur={(e) => handleItemChange(item.id, 'price', e.currentTarget.textContent || '0')}>{item.price}</span>
                                    </td>
                                    <button onClick={() => handleDeleteItem(item.id)} className="delete-item-btn no-print absolute top-1/2 right-0.5 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 font-bold text-xl leading-none">×</button>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-start mt-2 no-print">
                        <button onClick={handleAddItem} className="text-sm text-blue-500 hover:text-blue-700 font-semibold">+ Add Item</button>
                    </div>

                    <div className="mt-5 mb-5" style={dashedBorderStyle}></div>

                    {/* Totals */}
                    <div className="flex justify-between items-center mt-6">
                         <div className="w-1/2 flex justify-center items-center">
                            <p className="thank-you-text text-4xl transform -rotate-12 opacity-85" style={{...primaryTextColor, fontFamily: "'Dancing Script', cursive"}}>Thank You!</p>
                        </div>
                        <div className="w-1/2" style={textColor2}>
                            <div className="flex justify-between mb-2"><span>TOTAL TIFFIN:</span><span>{totalTiffins}</span></div>
                            <div className="flex justify-between mb-2"><span>TOTAL AMOUNT:</span><span>₹{totalAmount.toFixed(0)}</span></div>
                            <div className="flex justify-between mb-2"><span>AMOUNT PAID:</span><span>₹<span contentEditable suppressContentEditableWarning onBlur={(e) => handleAmountPaidChange(e.currentTarget.textContent || '0')}>{amountPaid}</span></span></div>
                            <div className="flex justify-between mb-2"><span>TAX:</span><span><span contentEditable suppressContentEditableWarning onBlur={(e) => handleTaxChange(e.currentTarget.textContent || '0')}>{taxPercent}</span>%</span></div>
                            <div className="flex justify-between font-bold text-lg" style={textColor1}><span>AMOUNT DUE:</span><span>₹{amountDue.toFixed(0)}</span></div>
                        </div>
                    </div>
                    <div className="mt-8" style={dashedBorderStyle}></div>
                    
                    {/* Footer */}
                     <footer className="pt-4 text-xs" style={textColor2}>
                        <div className="flex items-start">
                            <svg className="w-4 h-4 mr-3 flex-shrink-0 mt-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <p>Shop No. 8, First Floor, Aarcity Market, Sector 16C, Gaur City 2, Greater Noida, Ghaziabad, Uttar Pradesh 201009</p>
                        </div>
                        <div className="flex items-center mt-3">
                            <svg className="w-4 h-4 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
                            </svg>
                            <p>8826513777</p>
                        </div>
                    </footer>
                </main>
            </div>
            
             {/* Controls */}
             <div className="mt-8 text-center flex justify-center space-x-4 no-print">
                <button onClick={() => imageUploadRef.current?.click()} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-colors">
                    Upload Image
                </button>
                 <button onClick={() => excelUploadRef.current?.click()} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-colors">
                    Upload Excel
                </button>
                <button onClick={handleDownloadPdf} style={btnThemed} className="text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:brightness-90">
                    Download PDF
                </button>
                <input type="file" ref={imageUploadRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <input type="file" ref={excelUploadRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
            </div>

        </div>
    );
}

export default App;
