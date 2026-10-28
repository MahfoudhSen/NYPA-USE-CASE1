/**
 * NYISO Fuel Mix Data Generator
 * Generates realistic sample data for New York electricity generation
 * Based on NYISO RT_FUEL_MIX structure and typical NY fuel mix patterns
 */

export interface FuelMixRecord {
  timestamp: Date;
  timeZone: string;
  fuelCategory: string;
  genMW: number;
}

export interface HourlyFuelMix {
  timestamp: Date;
  dual_fuel: number;
  hydro: number;
  natural_gas: number;
  nuclear: number;
  other_fossil_fuels: number;
  other_renewables: number;
  wind: number;
  solar: number;
  total: number;
}

export interface EmissionFactors {
  dual_fuel: number;
  hydro: number;
  natural_gas: number;
  nuclear: number;
  other_fossil_fuels: number;
  other_renewables: number;
  wind: number;
  solar: number;
}

// Standard EPA emission factors (kg CO2/MWh)
export const EMISSION_FACTORS: EmissionFactors = {
  natural_gas: 400,
  dual_fuel: 600,
  other_fossil_fuels: 750,
  nuclear: 0,
  hydro: 0,
  wind: 0,
  solar: 0,
  other_renewables: 0,
};

/**
 * Generate realistic NYISO fuel mix data
 * NY typical mix: Nuclear 30%, Natural Gas 40%, Hydro 20%, Wind/Solar/Renewables 10%
 */
export function generateNYISOFuelMix(
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 60
): HourlyFuelMix[] {
  const data: HourlyFuelMix[] = [];
  const current = new Date(startDate);

  // Base load in MW (NY typically generates 15,000-25,000 MW)
  const baseLoad = 18000;

  while (current <= endDate) {
    const hour = current.getHours();
    const month = current.getMonth();
    const dayOfWeek = current.getDay();

    // Time-based load adjustments
    let loadMultiplier = 1.0;

    // Daily pattern: higher during day, lower at night
    if (hour >= 6 && hour <= 22) {
      loadMultiplier = 1.1 + (hour >= 14 && hour <= 18 ? 0.2 : 0); // Peak at 2-6 PM
    } else {
      loadMultiplier = 0.8; // Night hours
    }

    // Seasonal patterns
    if (month >= 5 && month <= 8) {
      // Summer: higher AC demand
      loadMultiplier *= 1.15;
    } else if (month >= 11 || month <= 2) {
      // Winter: higher heating demand
      loadMultiplier *= 1.1;
    }

    // Weekend vs weekday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      loadMultiplier *= 0.9; // Lower weekend demand
    }

    const totalLoad = baseLoad * loadMultiplier + (Math.random() - 0.5) * 1000;

    // Nuclear: baseload, consistent (~30%)
    const nuclear = 5500 + (Math.random() - 0.5) * 200;

    // Hydro: varies by season and time (~15-20%)
    const hydroBase = month >= 3 && month <= 6 ? 3500 : 2500; // Higher in spring
    const hydro = hydroBase + (Math.random() - 0.5) * 500;

    // Solar: only during daylight, peak at noon
    let solar = 0;
    if (hour >= 6 && hour <= 19) {
      const solarPeak = month >= 5 && month <= 8 ? 1200 : 600;
      const hourFactor = 1 - Math.abs(13 - hour) / 7;
      solar = solarPeak * hourFactor * (0.8 + Math.random() * 0.4);
    }

    // Wind: variable, higher in winter and at night
    const windBase = month >= 10 || month <= 3 ? 2000 : 1000;
    const windNightBoost = hour >= 20 || hour <= 6 ? 1.3 : 1.0;
    const wind = windBase * windNightBoost * (0.5 + Math.random() * 1.0);

    // Other renewables (biomass, etc): small, consistent
    const other_renewables = 400 + (Math.random() - 0.5) * 100;

    // Calculate remaining load to be met by natural gas and dual fuel
    const remainingLoad = totalLoad - nuclear - hydro - solar - wind - other_renewables;

    // Natural gas: fills most of remaining demand
    const naturalGasRatio = 0.75 + Math.random() * 0.15;
    const natural_gas = Math.max(0, remainingLoad * naturalGasRatio);

    // Dual fuel: fills the rest
    const dual_fuel = Math.max(0, remainingLoad * (1 - naturalGasRatio) * 0.7);

    // Other fossil fuels: minimal in modern NY grid
    const other_fossil_fuels = Math.max(0, remainingLoad - natural_gas - dual_fuel);

    const total =
      nuclear +
      hydro +
      natural_gas +
      dual_fuel +
      wind +
      solar +
      other_renewables +
      other_fossil_fuels;

    data.push({
      timestamp: new Date(current),
      dual_fuel: Math.round(dual_fuel),
      hydro: Math.round(hydro),
      natural_gas: Math.round(natural_gas),
      nuclear: Math.round(nuclear),
      other_fossil_fuels: Math.round(other_fossil_fuels),
      other_renewables: Math.round(other_renewables),
      wind: Math.round(wind),
      solar: Math.round(solar),
      total: Math.round(total),
    });

    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return data;
}

/**
 * Calculate emissions in kg CO2 for a fuel mix record
 */
export function calculateEmissions(fuelMix: HourlyFuelMix): number {
  return (
    fuelMix.natural_gas * EMISSION_FACTORS.natural_gas +
    fuelMix.dual_fuel * EMISSION_FACTORS.dual_fuel +
    fuelMix.other_fossil_fuels * EMISSION_FACTORS.other_fossil_fuels +
    fuelMix.nuclear * EMISSION_FACTORS.nuclear +
    fuelMix.hydro * EMISSION_FACTORS.hydro +
    fuelMix.wind * EMISSION_FACTORS.wind +
    fuelMix.solar * EMISSION_FACTORS.solar +
    fuelMix.other_renewables * EMISSION_FACTORS.other_renewables
  );
}

/**
 * Calculate percentage of clean energy in the mix
 */
export function calculateCleanPercentage(fuelMix: HourlyFuelMix): number {
  const cleanEnergy =
    fuelMix.nuclear +
    fuelMix.hydro +
    fuelMix.wind +
    fuelMix.solar +
    fuelMix.other_renewables;
  return (cleanEnergy / fuelMix.total) * 100;
}

/**
 * Determine if an hour is "clean" (>60% clean energy) or "dirty"
 */
export function isCleanHour(fuelMix: HourlyFuelMix): boolean {
  return calculateCleanPercentage(fuelMix) > 60;
}

/**
 * Generate sample data for a date range
 */
export function generateSampleData(daysBack: number = 30): HourlyFuelMix[] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  return generateNYISOFuelMix(startDate, endDate, 60); // Hourly data
}
