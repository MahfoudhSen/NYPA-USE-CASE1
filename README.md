# NYISO/NYPA Real-Time Energy Emission Profiler

Professional emissions monitoring dashboard for New York State's electricity grid.

![Dashboard Preview](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?logo=tailwindcss)

## Features

- **Real-time Emissions Tracking** - Monitor CO2 emissions from New York's power grid
- **Trend Analysis** - Day-over-day, week-over-week, and month-over-month comparisons
- **Fuel Mix Visualization** - Interactive pie charts showing current energy sources
- **Clean vs Dirty Hours** - Track hours with >60% clean energy
- **High Emissions Alerts** - Identify periods of elevated emissions
- **EPA Emission Factors** - Industry-standard CO2 calculations (kg CO2/MWh)

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Recharts** - Interactive data visualizations
- **Tailwind CSS** - Utility-first styling
- **date-fns** - Date manipulation
- **Lucide React** - Icon library

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build for Production

```bash
npm run build
npm start
```

## Data Source

Currently uses simulated NYISO fuel mix data based on realistic New York State generation patterns:

- **Nuclear**: ~30% (baseload)
- **Natural Gas**: ~40% (flexible generation)
- **Hydro**: ~20% (seasonal variation)
- **Wind/Solar/Renewables**: ~10% (time-dependent)

### Emission Factors (EPA Standard)

| Fuel Type | kg CO2/MWh |
|-----------|------------|
| Natural Gas | 400 |
| Dual Fuel | 600 |
| Other Fossil | 750 |
| Nuclear/Hydro/Wind/Solar | 0 |

## Key Metrics

- **Day-over-Day Trend** - Daily emissions change percentage
- **Week-over-Week Trend** - Weekly emissions change percentage
- **Month-over-Month Trend** - Monthly emissions change percentage
- **Clean Hours** - Hours with >60% renewable/nuclear energy
- **Total Emissions** - Cumulative CO2 output in metric tons

## Screenshots

The dashboard includes:
- Daily emissions trend chart (area graph)
- Current fuel mix breakdown (pie chart)
- Clean vs dirty hours comparison
- High emissions alert table
- EPA emission factors reference

## Use Cases

- Environmental impact analysis
- Grid operations monitoring
- Energy policy research
- Carbon accounting
- Renewable energy advocacy

## Future Enhancements

- [ ] Real NYISO API integration
- [ ] Historical data comparison
- [ ] Predictive emissions modeling
- [ ] Export data to CSV/JSON
- [ ] Email alerts for high-emission periods
- [ ] Multi-region comparison

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT

## Acknowledgments

- NYISO for grid data structure
- EPA for emission factors
- New York Power Authority (NYPA)

---

Built for PowerHack by the Vilopran Team
