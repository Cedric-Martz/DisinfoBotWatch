const API_BASE = 'http://localhost:5000/api';
const ANIMATION_DURATION = 2000;
const charts = {};

console.log('[APP] DisinfoBotWatch client starting...');
document.addEventListener('DOMContentLoaded', () =>
{
    console.log('[APP] DOM content loaded');
    setupNavigation();
    loadStats();
    setupChartUpdates();
});

function setupNavigation()
{
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () =>
        {
            navigateTo(btn.dataset.page);
        });
    });
}

function navigateTo(page)
{
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn =>
    {
        btn.classList.remove('active');
        if (btn.dataset.page === page)
            btn.classList.add('active');
    });

    if (page === 'accounts')
        loadTopAccounts();
    else if (page === 'distribution')
        loadDistribution();
    else if (page === 'network')
        loadNetworkLazy();
}

async function loadStats()
{
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const stats = await response.json();

        updateStatus('Connected', true);
        animateStats(stats);
    } catch (error) {
        console.error('Error loading statss:', error);
        updateStatus('Error loading data', false);
    }
}

function animateStats(stats)
{
    const cards = document.querySelectorAll('.stat-card');

    anime.timeline()
        .add({
            targets: '.stat-card',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 600,
            delay: anime.stagger(100),
            easing: 'easeOutExpo'
        })
        .add({
            targets: '.stat-value',
            duration: ANIMATION_DURATION,
            easing: 'easeInOutQuad'
        }, 0);

    animateCounter(stats.total_bots, 'total_bots');
    animateCounter(stats.total_tweets, 'total_tweets');
    animateCounter(stats.unique_accounts, 'unique_accounts');
    animateCounter(stats.avg_tweets_per_bot, 'avg_tweets_per_bot');
}

function animateCounter(value, target)
{
    const element = document.querySelector(`[data-target="${target}"]`);
    if (!element) {
        console.warn(`[WARN] Element with data-target="${target}" not found`);
        return;
    }
    let current = 0;
    const increment = value / (ANIMATION_DURATION / 16);
    const counter = setInterval(() =>
    {
        current += increment;
        if (current >= value) {
            current = value;
            clearInterval(counter);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

async function loadTopAccounts()
{
    try {
        const response = await fetch(`${API_BASE}/top-accounts`);
        if (!response.ok)
            throw new Error(`HTTP error :-( ===> ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error('Invalid data format:', data);
            return;
        }

        const topNumberLimit = parseInt(document.getElementById('top-n-select')?.value || 20);
        const topData = data.slice(0, topNumberLimit);

        updateTopAccountsChart(topData);
        updateAccountsTable(topData);
    } catch (error) {
        console.error('Error loading top accounts:', error);
        updateStatus('Error loading data', false);
    }
}

function updateTopAccountsChart(data)
{
    const authors = data.map(d => d.author).slice(0, 20);
    const counts = data.map(d => d.tweet_count).slice(0, 20);
    const canvaContext = document.getElementById('topAccountsChart')?.getContext('2d');

    if (!canvaContext)
        return;
    if (charts.topAccounts)
        charts.topAccounts.destroy();

    charts.topAccounts = new Chart(canvaContext, {
        type: 'bar',
        data: {
            labels: authors,
            datasets: [{
                label: 'Tweets',
                data: counts,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            }
        }
    });
}

function updateAccountsTable(data)
{
    const tbody = document.getElementById('accountsTableBody');
    tbody.innerHTML = '';

    data.slice(0, 20).forEach((account, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${account.author}</td>
            <td>${account.account_type || '-'}</td>
            <td>${account.account_category || '-'}</td>
            <td>${account.tweet_count?.toLocaleString() || 0}</td>
        `;
        tbody.appendChild(row);
    });
}

async function loadDistribution()
{
    try {
        const response = await fetch(`${API_BASE}/account-distribution`);
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('Invalid data format:', data);
            return;
        }
        updateDistributionCharts(data);
    } catch (error) {
        console.error('Error loading distribution:', error);
        updateStatus('Error loading data', false);
    }
}

function updateDistributionCharts(data)
{
    if (!Array.isArray(data)) {
        console.error('Invalid data format:', data);
        return;
    }
    const typeGroups = {};
    const categoryGroups = {};

    data.forEach(item => {
        const type = item.account_type || 'Unknown';
        const category = item.account_category || 'Unknown';

        typeGroups[type] = (typeGroups[type] || 0) + (item.count || 0);
        categoryGroups[category] = (categoryGroups[category] || 0) + (item.count || 0);
    });

    const topTypes = Object.entries(typeGroups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const topCategories = Object.entries(categoryGroups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    createPieChart('typeDistributionChart', topTypes, 'Account Type Distribution');
    createPieChart('categoryDistributionChart', topCategories, 'Account Category Distribution');
}

function createPieChart(canvasId, data, title)
{
    const canvaContext = document.getElementById(canvasId)?.getContext('2d');
    if (!canvaContext)
        return;

    const labels = data.map(d => d[0]);
    const values = data.map(d => d[1]);
    const colors = generateColors(data.length);

    if (charts[canvasId])
        charts[canvasId].destroy();

    charts[canvasId] = new Chart(canvaContext, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: 'rgba(15, 23, 42, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'rgba(255, 255, 255, 0.8)' }
                },
                title: {
                    display: false
                }
            }
        }
    });
}

function generateColors(count)
{
    const colors = [
        'rgba(99, 102, 241, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(8, 145, 178, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(59, 130, 246, 0.8)',
    ];
    return colors.slice(0, count);
}

function setupChartUpdates()
{
    const select = document.getElementById('top-n-select');
    if (select)
        select.addEventListener('change', loadTopAccounts);
}

async function loadNetworkLazy()
{
    const iframe = document.getElementById('networkFrame');
    const placeholder = document.getElementById('networkPlaceholder');

    // console.log('[NETWORK] iframe element:', iframe);
    // console.log('[NETWORK] placeholder element:', placeholder);
    // console.log('[NETWORK] iframe.src value:', iframe.src);
    // console.log('[NETWORK] iframe.src is truthy:', !!iframe.src);

    const isLoaded = iframe.src && iframe.src.includes('/api/network-html');

    if (isLoaded)
        return;

    try {
        iframe.onload = () => {
            iframe.style.display = 'block';
            placeholder.style.display = 'none';
        };
        iframe.onerror = () => {
            placeholder.innerHTML = '<p>Error loading network visualization</p>';
        };
        iframe.src = '/api/network-html';
        setTimeout(() => {
            if (iframe.style.display !== 'block')
                console.warn('[NETWORK] iframe did not load within 10 seconds');
        }, 10000);
    } catch (error) {
        console.error('[NETWORK] Error loading network:', error);
        placeholder.innerHTML = '<p>Error loading network visualization</p>';
    }
}

function updateStatus(text, isConnected)
{
    const statusText = document.getElementById('status-text');
    const statusDot = document.querySelector('.status-dot');

    statusText.textContent = text;
    statusDot.style.background = isConnected ? '#10b981' : '#ef4444';
}

function formatNumber(num)
{
    return new Intl.NumberFormat('en-US').format(num);
}
