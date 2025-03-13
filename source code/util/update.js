const updatesTab = document.getElementById('updates-tab');
const plannedFeaturesTab = document.getElementById('planned-features-tab');
const updatesContent = document.getElementById('updates-content');
const plannedFeaturesContent = document.getElementById('planned-features-content');

updatesTab.addEventListener('click', () => {
    updatesContent.style.display = 'block';
    plannedFeaturesContent.style.display = 'none';
    updatesTab.style.borderBottom = '2px solid #000';
    plannedFeaturesTab.style.borderBottom = 'none';
});

plannedFeaturesTab.addEventListener('click', () => {
    plannedFeaturesContent.style.display = 'block';
    updatesContent.style.display = 'none';
    plannedFeaturesTab.style.borderBottom = '2px solid #000';
    updatesTab.style.borderBottom = 'none';
});