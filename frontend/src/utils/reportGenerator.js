import jsPDF from 'jspdf'

export function generateReport({ prediction, compare, features }) {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Gentrification Prediction Report', 10, 20)
    doc.setFontSize(12)
    doc.text(`Prediction: ${(prediction * 100).toFixed(2)}%`, 10, 40)
    doc.text('Inputs:', 10, 50)
    let y = 60
    Object.keys(features).forEach(k => {
        doc.text(`${k}: ${features[k]}`, 12, y)
        y += 6
    })
    doc.text('Model Comparison:', 10, y)
    y += 10
    Object.keys(compare).forEach(k => {
        doc.text(`${k}: ${(compare[k] * 100).toFixed(2)}%`, 12, y)
        y += 6
    })
    doc.save('gentrification_report.pdf')
}