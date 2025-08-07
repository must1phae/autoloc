// frontend/js/booking-traffic.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';
    const chartContainer = document.getElementById('heatmap-chart-container');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    let chart; // Variable pour stocker l'instance du graphique

    /**
     * Charge les données et dessine le graphique
     */
    async function loadAndRenderChart() {
        try {
            const response = await fetch(`${API_URL}?action=getBookingTraffic`);
            const result = await response.json();

            if (result.success) {
                chartContainer.innerHTML = ''; // Vider le message de chargement
                renderHeatmap(result.data.historical, result.data.predictions);
            } else {
                chartContainer.innerHTML = `<p class="message-error">${result.message}</p>`;
            }
        } catch (error) {
            chartContainer.innerHTML = '<p class="message-error">Erreur de connexion.</p>';
        }
    }

    /**
     * Configure et affiche la carte thermique avec ApexCharts
     */
    function renderHeatmap(historicalData, predictionData) {
        const options = {
            series: [
                { name: 'Réservations', data: historicalData },
                { name: 'Prédictions', data: predictionData }
            ],
            chart: {
                height: 350,
                type: 'heatmap',
                toolbar: { show: true }
            },
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0.5,
                    radius: 0,
                    useFillColorAsStroke: true,
                    colorScale: {
                        ranges: [
                            { from: 0, to: 0, name: 'Faible', color: '#f0f0f0' },
                            { from: 1, to: 2, name: 'Moyen', color: '#B4D4FF' },
                            { from: 3, to: 5, name: 'Élevé', color: '#86B6F6' },
                            { from: 6, to: 10, name: 'Très élevé', color: '#176B87' }
                        ]
                    }
                }
            },
            dataLabels: {
                enabled: true,
                style: { colors: ['#000'] }
            },
            stroke: { width: 1 },
            title: { text: 'Intensité des Réservations par Jour', align: 'center' },
            tooltip: {
                y: {
                    formatter: function(value) {
                        return value + " réservation(s)";
                    }
                }
            }
        };

        chart = new ApexCharts(chartContainer, options);
        chart.render();
    }

    /**
     * Gère l'export en PDF
     */
    exportPdfBtn.addEventListener('click', () => {
        if (chart) {
            // On utilise html2canvas pour "photographier" le graphique
            html2canvas(chartContainer).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                
                // On utilise jsPDF pour créer un PDF et y insérer l'image
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save('trafic-reservations-autoloc.pdf');
            });
        } else {
            alert("Le graphique n'est pas encore chargé.");
        }
    });

    // Lancement
    loadAndRenderChart();
});