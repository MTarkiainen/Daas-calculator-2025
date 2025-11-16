import { Quote, TcoSettings, LeaseRateFactorsData, Profile, UserRole, CalculationItem, LeaseRateFactorsMap, Condition, AssetType } from '../types';
import { INDUSTRIES_WACC, USED_ASSET_LRF_KEY } from '../constants';

// This function is moved from CalculationSheet.tsx for reuse
export const getLeaseRateFactor = (
  factors: LeaseRateFactorsMap, 
  item: Pick<CalculationItem, 'assetType' | 'operatingSystem' | 'leaseTerm' | 'condition' | 'nonReturnPercentage' | 'brand'>,
  nonReturnUpliftFactor: number,
  partnerCommission: number = 0
): number => {
  const { assetType, operatingSystem, brand, leaseTerm, condition, nonReturnPercentage } = item;
  
  let baseLrf = 0;
  if (condition === Condition.Used) {
    baseLrf = factors[USED_ASSET_LRF_KEY]?.[leaseTerm] || 0;
  } else if (assetType === AssetType.Mobile) {
    // Mobile Hierarchy: AssetType -> OS
    const keysToTry: string[] = [];
    if (operatingSystem) keysToTry.push(`${assetType}-${operatingSystem}`);
    keysToTry.push(assetType);
    for (const key of keysToTry) {
        if (factors[key]?.[leaseTerm] !== undefined) {
            baseLrf = factors[key][leaseTerm]!;
            break;
        }
    }
  } else {
    // Default Hierarchy: AssetType -> Brand -> OS
    const keysToTry: string[] = [];
    if (brand && operatingSystem) keysToTry.push(`${assetType}-${brand}-${operatingSystem}`);
    if (brand) keysToTry.push(`${assetType}-${brand}`);
    keysToTry.push(assetType);

    for (const key of keysToTry) {
      if (factors[key]?.[leaseTerm] !== undefined) {
        baseLrf = factors[key][leaseTerm]!;
        break;
      }
    }
  }
  
  let finalLrf = baseLrf;

  const nonReturnApplicableAssets: AssetType[] = [AssetType.Laptop, AssetType.Mobile, AssetType.Tablet];
  if (nonReturnApplicableAssets.includes(assetType) && nonReturnPercentage && nonReturnPercentage > 0) {
    const totalUpliftMultiplier = nonReturnUpliftFactor * nonReturnPercentage;
    finalLrf = finalLrf * (1 + totalUpliftMultiplier);
  }
  
  if (partnerCommission > 0) {
    const commissionFactor = (partnerCommission / 100) / leaseTerm;
    finalLrf += commissionFactor;
  }

  return finalLrf;
};

// This function is created from logic extracted from TcoSheet.tsx
export const calculateTco = (
    quote: Quote,
    lrfData: LeaseRateFactorsData,
    tcoSettings: TcoSettings,
    currentUser: Profile
) => {
    if (!quote.options || quote.options.every(o => o.items.length === 0)) {
        return null;
    }

    const allItems = quote.options.flatMap(o => o.items);
    const partnerCommission = currentUser.role === UserRole.Partner ? currentUser.commissionPercentage || 0 : 0;

    const totalDevices = allItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPurchasePrice = allItems.reduce((sum, item) => sum + (item.hardwareCost * item.quantity), 0);
    
    const totalLeaseCost = allItems.reduce((total, item) => {
        const totalOneTimeServicesCost = item.additionalServices.reduce((sum, service) => sum + service.cost, 0) * item.quantity;
        const hardwareMonthlyCost = item.hardwareCost * getLeaseRateFactor(lrfData.factors, item, lrfData.nonReturnUpliftFactor || 0.008, partnerCommission) * item.quantity;
        const totalHardwareLeaseCost = hardwareMonthlyCost * item.leaseTerm;
        return total + totalHardwareLeaseCost + totalOneTimeServicesCost;
    }, 0);
    
    const weightedTermNumerator = allItems.reduce((sum, item) => sum + (item.leaseTerm * item.hardwareCost * item.quantity), 0);
    const weightedAvgTermMonths = totalPurchasePrice > 0 ? weightedTermNumerator / totalPurchasePrice : 0;
    const weightedAvgTermYears = weightedAvgTermMonths / 12;
    
    const wacc = tcoSettings.useCustomWacc ? tcoSettings.customWacc : INDUSTRIES_WACC[tcoSettings.selectedIndustry];
    const costOfCapital = totalPurchasePrice * (Math.pow(1 + (wacc / 100), weightedAvgTermYears) - 1);

    const totalDeploymentCost = tcoSettings.deploymentCostPerDevice * totalDevices;
    const totalSupportCost = tcoSettings.itSupportHoursPerDeviceYear * tcoSettings.itStaffHourlyRate * totalDevices * weightedAvgTermYears;
    const totalDowntimeCost = tcoSettings.failuresPerDeviceYear * tcoSettings.downtimeHoursPerFailure * tcoSettings.employeeCostPerHour * totalDevices * weightedAvgTermYears;
    const totalEoldCost = tcoSettings.eoldCostPerDevice * totalDevices;
    const totalResidualValue = totalPurchasePrice * (tcoSettings.residualValuePercentage / 100);

    const totalTcoForPurchase = totalPurchasePrice + costOfCapital + totalDeploymentCost + totalSupportCost + totalDowntimeCost + totalEoldCost - totalResidualValue;
    
    const absoluteSavings = totalTcoForPurchase - totalLeaseCost;
    const savingsPercentage = totalTcoForPurchase > 0 ? (absoluteSavings / totalTcoForPurchase) : 0;
    
    return {
        totalPurchasePrice,
        totalLeaseCost,
        totalTcoForPurchase,
        costOfCapital,
        totalDeploymentCost,
        totalSupportCost,
        totalDowntimeCost,
        totalEoldCost,
        totalResidualValue,
        absoluteSavings,
        savingsPercentage,
        weightedAvgTermMonths,
    };
};
