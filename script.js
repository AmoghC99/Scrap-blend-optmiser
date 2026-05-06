// Fetch and display dashboard data
async function loadDashboard() {
    try {
        const response = await fetch('dashboard_data.json');
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.statusText}`);
        }
        
        const data = await response.json();
        renderDashboard(data);
        updateTimestamp();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('content').innerHTML = `
            <div class="error">
                <strong>Error loading data:</strong> ${error.message}<br>
                Make sure <code>dashboard_data.json</code> is in the same directory as this file.
            </div>
        `;
    }
}

function renderDashboard(data) {
    let html = '<div class="dashboard">';

    // Summary Card
    if (data.summary) {
        html += createSummaryCard(data.summary);
    }

    // Optimization Card
    if (data.optimization) {
        html += createOptimizationCard(data.optimization);
    }

    // Simulation Card
    if (data.simulation) {
        html += createSimulationCard(data.simulation);
    }

    html += '</div>';

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
        html += createRecommendationsSection(data.recommendations);
    }

    // Shortages
    if (data.shortages_current || data.shortages_recommended) {
        html += createShortagesSection(data.shortages_current, data.shortages_recommended);
    }

    // Raw JSON Toggle
    html += `
        <div class="data-section">
            <h2>Raw Data</h2>
            <button class="toggle-btn" onclick="toggleJSON()">Show/Hide Full JSON</button>
            <div id="json-container" class="json-view" style="display: none;">
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        </div>
    `;

    document.getElementById('content').innerHTML = html;
}

function createSummaryCard(summary) {
    return `
        <div class="card">
            <h3>📋 Summary</h3>
            <p><span class="label">Period:</span> <span class="value">${summary.period || 'N/A'}</span></p>
            <p><span class="label">Grades:</span> <span class="value">${summary.num_grades || 'N/A'}</span></p>
            <p><span class="label">Stocks:</span> <span class="value">${summary.num_stocks || 'N/A'}</span></p>
            <p><span class="label">Heats:</span> <span class="value">${summary.num_heats || 'N/A'}</span></p>
        </div>
    `;
}

function createOptimizationCard(opt) {
    const status = opt.status === 'optimal' ? 'success' : 'warning';
    return `
        <div class="card">
            <h3>⚙️ Optimization</h3>
            <p><span class="label">Status:</span> <span class="status ${status}">${opt.status || 'Unknown'}</span></p>
            <p><span class="label">Annual Savings:</span> <span class="value">${formatNumber(opt.annual_savings_usd || 0)}</span></p>
            <p><span class="label">Monthly Run Cost:</span> <span class="value">${formatNumber(opt.monthly_run_cost_usd || 0)}</span></p>
            <p><span class="label">Model Version:</span> ${opt.model_version || 'N/A'}</p>
        </div>
    `;
}

function createSimulationCard(sim) {
    if (!sim.summary) return '';
    return `
        <div class="card">
            <h3>📈 Simulation</h3>
            <p><span class="label">Days Analyzed:</span> <span class="value">${sim.summary.num_days || 'N/A'}</span></p>
            <p><span class="label">Current Shortage Days:</span> <span class="value" style="color: #dc3545;">${sim.summary.shortage_days_current || 0}</span></p>
            <p><span class="label">Recommended Shortage Days:</span> <span class="value" style="color: #28a745;">${sim.summary.shortage_days_recommended || 0}</span></p>
        </div>
    `;
}

function createRecommendationsSection(recommendations) {
    let html = '<div class="data-section"><h2>🎯 Recommendations</h2><div class="table-container"><table>';
    html += '<tr><th>Grade</th><th>Current</th><th>Recommended</th><th>Change</th><th>Reason</th></tr>';
    
    recommendations.forEach(rec => {
        const change = (rec.recommended_blend || 0) - (rec.current_blend || 0);
        const changePercent = ((change / (rec.current_blend || 1)) * 100).toFixed(1);
        html += `
            <tr>
                <td><strong>${rec.grade || 'N/A'}</strong></td>
                <td>${formatNumber(rec.current_blend || 0)}</td>
                <td>${formatNumber(rec.recommended_blend || 0)}</td>
                <td>${change > 0 ? '↑' : '↓'} ${Math.abs(changePercent)}%</td>
                <td>${rec.reason || 'Optimization'}</td>
            </tr>
        `;
    });
    
    html += '</table></div></div>';
    return html;
}

function createShortagesSection(current, recommended) {
    let html = '<div class="data-section"><h2>⚠️ Shortages Analysis</h2>';
    
    if (current && Object.keys(current).length > 0) {
        html += '<h3 style="color: #dc3545; margin-top: 15px;">Current Approach</h3>';
        html += createShortagesTable(current);
    }
    
    if (recommended && Object.keys(recommended).length > 0) {
        html += '<h3 style="color: #28a745; margin-top: 15px;">Recommended Approach</h3>';
        html += createShortagesTable(recommended);
    }
    
    html += '</div>';
    return html;
}

function createShortagesTable(shortages) {
    let html = '<div class="table-container"><table>';
    html += '<tr><th>Grade</th><th>Days Short</th><th>Total Shortfall</th></tr>';
    
    Object.entries(shortages).forEach(([grade, data]) => {
        html += `
            <tr>
                <td><strong>${grade}</strong></td>
                <td>${data.days_short || 0}</td>
                <td>${formatNumber(data.total_shortfall || 0)} units</td>
            </tr>
        `;
    });
    
    html += '</table></div>';
    return html;
}

function formatNumber(num) {
    if (typeof num !== 'number') return 'N/A';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
}

function toggleJSON() {
    const container = document.getElementById('json-container');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
}

function updateTimestamp() {
    const now = new Date();
    document.getElementById('updated').textContent = `Last updated: ${now.toLocaleString()}`;
}

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard);
