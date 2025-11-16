

import React from 'react';
import { CartItem, Quote, LeaseRateFactorsData, CalculationItem, Profile, UserRole } from '../../types';
import { getLeaseRateFactor } from '../../utils/calculationUtils';
import TrashIcon from '../ui/icons/TrashIcon';
import { Button } from '../ui/Button';

interface CartPopoverProps {
  cart: CartItem[];
  quote: Quote;
  lrfData: LeaseRateFactorsData;
  onUpdateQuantity: (calculationItemId: string, quantity: number) => void;
  onRemove: (calculationItemId: string) => void;
  onClose: () => void;
  currentUser: Profile;
}

const CartPopover: React.FC<CartPopoverProps> = ({ cart, quote, lrfData, onUpdateQuantity, onRemove, onClose, currentUser }) => {
  const locale = 'en-GB';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
  };

  const partnerCommission = currentUser.role === UserRole.Partner ? currentUser.commissionPercentage || 0 : 0;
  const allItems = quote.options.flatMap(o => o.items);
  const cartDetails = cart.map(cartItem => {
    const calcItem = allItems.find(item => item.id === cartItem.calculationItemId);
    return { ...cartItem, details: calcItem };
  }).filter(item => item.details); // Filter out items that might not be in the quote anymore

  const subtotal = cartDetails.reduce((total, item) => {
    const calcItem = item.details as CalculationItem;
    // Services are one-time costs, so they are not part of the monthly subtotal.
    const factor = getLeaseRateFactor(lrfData.factors, calcItem, lrfData.nonReturnUpliftFactor || 0.008, partnerCommission);
    const monthlyHardwareCost = calcItem.hardwareCost * factor;
    return total + (monthlyHardwareCost * item.quantity);
  }, 0);


  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl z-50 border">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto">
        {cartDetails.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Your cart is empty.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {cartDetails.map(({ calculationItemId, quantity, details }) => {
              const calcItem = details as CalculationItem;
              const factor = getLeaseRateFactor(lrfData.factors, calcItem, lrfData.nonReturnUpliftFactor || 0.008, partnerCommission);
              const monthlyHardwareCostPerUnit = calcItem.hardwareCost * factor;
              
              return (
              <li key={calculationItemId} className="py-3 flex items-start space-x-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{`${calcItem.assetType} - ${calcItem.brand}`}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(monthlyHardwareCostPerUnit)} / month</p>
                  <div className="flex items-center mt-2">
                    <input 
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => onUpdateQuantity(calculationItemId, parseInt(e.target.value, 10) || 1)}
                      className="w-16 text-center border-gray-300 rounded-md shadow-sm text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(monthlyHardwareCostPerUnit * quantity)}</p>
                   <button onClick={() => onRemove(calculationItemId)} className="text-red-500 hover:text-red-700 mt-2 p-1 rounded-full hover:bg-red-100">
                      <TrashIcon />
                  </button>
                </div>
              </li>
            )})}
          </ul>
        )}
      </div>
      {cartDetails.length > 0 && (
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
           <div className="flex justify-between items-center text-lg font-semibold">
                <span>Subtotal (Monthly)</span>
                <span>{formatCurrency(subtotal)}</span>
           </div>
           <Button className="w-full mt-4">Proceed to Order</Button>
        </div>
      )}
    </div>
  );
};

export default CartPopover;
