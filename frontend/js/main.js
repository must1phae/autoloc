// frontend/js/main.js - VERSION AVEC BOUTON D'AUTH UNIQUE ET CHEMINS CONSERVÉS

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost/autoloc/backend/routes/api.php';

    // Sélecteurs du DOM
    const carListContainer = document.getElementById('car-list');
    const mainNav = document.getElementById('main-navigation');
    const searchInput = document.getElementById('search-input');
    const typeFilterButtons = document.getElementById('filter-type-buttons');
    const priceFilter = document.getElementById('price-filter');
    const yearFilter = document.getElementById('year-filter');

    // Variables globales pour l'état des filtres
    let allCars = [];
    let currentTypeFilter = 'all';
    let currentPriceFilter = 'all';
    let currentYearFilter = 'all';
    let currentSearchTerm = '';

    // --- 1. GESTION DE LA NAVBAR DYNAMIQUE ---
    async function setupNavbar() {
        if (!mainNav) return;
        
        const currentPage = window.location.pathname.split('/').pop();
        const navLinksData = [
            { href: 'index.html', label: 'Accueil' },
            { href: 'cars-list.html', label: 'Louer une Voiture' },
            { href: 'contact.html', label: 'Contact' }
        ];
        let baseNavLinks = navLinksData.map(link => {
            const isActive = (currentPage === link.href || (currentPage === '' && link.href === 'index.html')) ? 'active' : '';
            return `<li><a href="${link.href}" class="${isActive}">${link.label}</a></li>`;
        }).join('');
        
        const authResponse = await fetch(`${API_URL}?action=checkAuth`);
        const authResult = await authResponse.json();
        let userActionsHtml = '';

        if (authResult.success && authResult.isLoggedIn) {
            // CETTE PARTIE RESTE IDENTIQUE
            const user = authResult.user;
            const dashboardLink = user.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-client.html';
            userActionsHtml = `<div class="user-profile-icon"><a href="/${dashboardLink}"><span>${user.prenom.charAt(0).toUpperCase()}</span></a></div>`;
        
        } else {
            // =========================================================
            // ==      MODIFICATION DEMANDÉE : UN SEUL BOUTON       ==
            // =========================================================
            // Au lieu de deux boutons, on en met un seul qui pointe vers auth.html
            userActionsHtml = `
                <div class="auth-buttons">
                    <a href="frontend/pages/auth.html" class="btn btn-primary">Connexion / Inscription</a>
                </div>
            `;
            // =========================================================
        }
        
        mainNav.innerHTML = `<ul>${baseNavLinks}</ul><div class="nav-actions-container">${userActionsHtml}</div>`;
    }

    // --- 2. FONCTION CENTRALE DE FILTRAGE MISE À JOUR ---
    // CETTE FONCTION RESTE IDENTIQUE.
    function filterAndDisplayCars() {
        if (!carListContainer) return;

        let filteredCars = allCars;

        if (currentTypeFilter !== 'all') {
            filteredCars = filteredCars.filter(car => car.type.toLowerCase() === currentTypeFilter.toLowerCase());
        }
        if (currentPriceFilter !== 'all') {
            const [minPrice, maxPrice] = currentPriceFilter.split('-').map(Number);
            filteredCars = filteredCars.filter(car => car.prix_par_jour >= minPrice && car.prix_par_jour <= maxPrice);
        }
        if (currentYearFilter !== 'all') {
            const [minYear, maxYear] = currentYearFilter.split('-').map(Number);
            filteredCars = filteredCars.filter(car => car.annee >= minYear && car.annee <= maxYear);
        }
        if (currentSearchTerm) {
            filteredCars = filteredCars.filter(car => 
                `${car.marque} ${car.modele}`.toLowerCase().includes(currentSearchTerm)
            );
        }
        displayCars(filteredCars);
    }
    
    // --- 3. FONCTION D'AFFICHAGE ---
    // CETTE FONCTION RESTE IDENTIQUE, VOS CHEMINS SONT CONSERVÉS.
    function displayCars(carsToDisplay) {
        if (!carListContainer) return;
        
        carListContainer.innerHTML = '';
        const seeMoreContainer = document.getElementById('see-more-container');
        const filtersAreActive = currentTypeFilter !== 'all' || currentPriceFilter !== 'all' || currentYearFilter !== 'all' || currentSearchTerm !== '';

        if (carsToDisplay.length > 0) {
            const carsToShow = !filtersAreActive ? carsToDisplay.slice(0, 6) : carsToDisplay;
            carsToShow.forEach(car => {
                const carCard = document.createElement('div');
                carCard.className = 'car-card';
                carCard.innerHTML = `
                    <img src="../../uploads/cars/${car.image}" alt="${car.marque} ${car.modele}">
                    <div class="car-card-content">
                        <h3>${car.marque} ${car.modele}</h3>
                        <p>À partir de <strong>${car.prix_par_jour} €/jour</strong></p>
                        <a href="../pages/car-details.html?id=${car.id_voiture}" class="btn ">Voir détails et réserver</a>
                    </div>
                `;
                carListContainer.appendChild(carCard);
            });
            if (seeMoreContainer && allCars.length > 6 && !filtersAreActive) {
                seeMoreContainer.innerHTML = `<a href="cars-list.html" class="btn btn-primary">Voir toutes nos voitures</a>`;
                seeMoreContainer.style.display = 'block';
            } else if (seeMoreContainer) {
                seeMoreContainer.style.display = 'none';
            }
        } else {
            carListContainer.innerHTML = filtersAreActive 
                ? '<p>Aucune voiture ne correspond à vos critères de recherche.</p>' 
                : '<p>Aucune voiture disponible pour le moment.</p>';
        }
    }

    // --- 4. CHARGEMENT INITIAL DES DONNÉES ---
    // CETTE FONCTION RESTE IDENTIQUE.
    async function fetchAllCars() {
        try {
            const response = await fetch(`${API_URL}?action=getAllCars`);
            const result = await response.json();
            if (result.success && result.data) {
                allCars = result.data;
                filterAndDisplayCars();
            } else {
                carListContainer.innerHTML = '<p>Aucune voiture disponible pour le moment.</p>';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des voitures:', error);
            carListContainer.innerHTML = '<p>Impossible de charger les voitures.</p>';
        }
    }

    // --- 5. GESTION DES ÉVÉNEMENTS DE FILTRAGE ---
    // CETTE PARTIE RESTE IDENTIQUE.
    if (typeFilterButtons) {
        typeFilterButtons.addEventListener('click', (event) => {
            if (event.target.classList.contains('filter-btn')) {
                document.querySelector('.filter-btn.active').classList.remove('active');
                event.target.classList.add('active');
                currentTypeFilter = event.target.dataset.filterType;
                filterAndDisplayCars();
            }
        });
    }
    if (priceFilter) {
        priceFilter.addEventListener('change', (event) => {
            currentPriceFilter = event.target.value;
            filterAndDisplayCars();
        });
    }
    if (yearFilter) {
        yearFilter.addEventListener('change', (event) => {
            currentYearFilter = event.target.value;
            filterAndDisplayCars();
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            currentSearchTerm = event.target.value.toLowerCase().trim();
            filterAndDisplayCars();
        });
    }

    // --- 6. LANCEMENT ---
    setupNavbar();
    fetchAllCars();
});