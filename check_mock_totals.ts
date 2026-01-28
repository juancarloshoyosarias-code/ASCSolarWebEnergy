
import { mockPlants } from './src/data/mockData';

const totalInvestment = mockPlants.reduce((sum, p) => sum + p.investment, 0);
const totalSavings = mockPlants.reduce((sum, p) => sum + p.savingsTotal, 0);
const totalRecovered = (totalSavings / totalInvestment) * 100;

console.table({
    "Metric": ["Total Investment", "Total Savings", "Recovered %"],
    "Value": [totalInvestment, totalSavings, totalRecovered.toFixed(2) + "%"]
});

console.log("Per Plant Investment:");
mockPlants.forEach(p => console.log(`${p.plant_name || p.name}: ${p.investment}`));
