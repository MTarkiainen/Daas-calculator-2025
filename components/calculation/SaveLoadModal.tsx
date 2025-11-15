
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Quote, Template, QuoteStatus } from '../../types';
import TrashIcon from '../ui/icons/TrashIcon';
import { QUOTE_STATUSES } from '../../constants';
// Fix: Import uuidv4 for unique ID generation.
import { v4 as uuidv4 } from 'uuid';

interface QuoteDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedQuotes: Quote[];
  onQuoteDelete: (id: string) => void;
  setQuote: React.Dispatch<React.SetStateAction<Quote>>;
  createNewQuote: () => Quote;
  templates: Template[];
  onTemplateDelete: (id: string) => void;
  quote: Quote;
}

const QuoteDashboardModal: React.FC<QuoteDashboardModalProps> = ({ isOpen, onClose, savedQuotes, onQuoteDelete, setQuote, createNewQuote, templates, onTemplateDelete, quote }) => {
  const locale = 'en-GB';
  const [activeTab, setActiveTab] = useState<'quotes' | 'templates'>('quotes');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  
  const handleLoadQuote = (quoteId: string) => {
    const quoteToLoad = savedQuotes.find(q => q.id === quoteId);
    if (quoteToLoad) {
      setQuote(quoteToLoad);
      onClose();
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
     if (window.confirm("Are you sure you want to delete this quote?")) {
        onQuoteDelete(quoteId);
        if(quoteId === quote.id) setQuote(createNewQuote());
     }
  };

  // Note: Status change is local for now.
  const handleStatusChange = (quoteId: string, newStatus: QuoteStatus) => {
    // This should eventually trigger a save to the backend.
    const quoteToUpdate = savedQuotes.find(q => q.id === quoteId);
    if (quoteToUpdate) {
        // Here you would call an onQuoteSave prop if you wanted to persist this change
        console.warn("Status changed locally but not saved to DB yet.");
    }
  };
  
  const handleUseTemplate = (template: Template) => {
    const newQuote = createNewQuote();
    const newOption = newQuote.options[0];
    // Fix: Replaced weak random ID generation with uuidv4 for consistency and uniqueness.
    newOption.items = template.items.map(item => ({...item, id: uuidv4()}));
    setQuote({
        ...newQuote,
        projectName: `${template.name} Project`
    });
    onClose();
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
        onTemplateDelete(templateId);
    }
  };

  const filteredQuotes = savedQuotes
    .filter(q => statusFilter === 'all' || q.status === statusFilter)
    .filter(q => {
        const term = searchTerm.toLowerCase();
        return (q.projectName?.toLowerCase().includes(term) || q.customerName?.toLowerCase().includes(term))
    })
    .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dashboard">
      <div className="flex border-b">
        <button onClick={() => setActiveTab('quotes')} className={`px-4 py-2 -mb-px border-b-2 ${activeTab === 'quotes' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500'}`}>Quotes</button>
        <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 -mb-px border-b-2 ${activeTab === 'templates' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500'}`}>Templates</button>
      </div>

      <div className="flex gap-4 my-4">
        <Input placeholder="Search customers or projects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow" />
        {activeTab === 'quotes' && (
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as QuoteStatus | 'all')}>
            <option value="all">All Statuses</option>
            {QUOTE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {activeTab === 'quotes' && (
           <ul className="divide-y divide-gray-200">
            {filteredQuotes.length > 0 ? filteredQuotes.map(q => (
              <li key={q.id} className="py-3 flex flex-col md:flex-row md:items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{q.customerName || "Untitled Customer"}</p>
                  <p className="text-xs text-brand-600">{q.projectName || "Untitled Project"}</p>
                  <p className="text-xs text-gray-400">{`Updated: ${new Date(q.updatedAt).toLocaleString(locale)}`}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={q.status} onChange={e => handleStatusChange(q.id, e.target.value as QuoteStatus)} className="w-32">
                      {QUOTE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Button size="sm" onClick={() => handleLoadQuote(q.id)}>Load</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteQuote(q.id)}><TrashIcon /></Button>
                </div>
              </li>
            )) : <p className="text-center text-gray-500 py-8">No quotes found.</p>}
          </ul>
        )}
        {activeTab === 'templates' && (
            <ul className="divide-y divide-gray-200">
                {filteredTemplates.length > 0 ? filteredTemplates.map(t => (
                    <li key={t.id} className="py-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">{t.name}</p>
                        <div className="flex items-center space-x-2">
                            <Button size="sm" onClick={() => handleUseTemplate(t)}>Use Template</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteTemplate(t.id)}><TrashIcon /></Button>
                        </div>
                    </li>
                )) : <p className="text-center text-gray-500 py-8">No templates found.</p>}
            </ul>
        )}
      </div>
    </Modal>
  );
};

export default QuoteDashboardModal;
