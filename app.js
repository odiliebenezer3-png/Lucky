const API_BASE = '/api';

async function fetchJson(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error('Unable to load data');
  }
  return response.json();
}

function createTutorialCard(item) {
  return `
    <article class="tutorial-card">
      <div class="tutorial-thumb" aria-label="${item.title} thumbnail"></div>
      <div class="tutorial-body">
        <div class="meta-row">
          <span>${item.category}</span>
          <span>${item.duration}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
        <button class="btn btn-primary" type="button" data-slug="${item.slug}">Read lesson</button>
      </div>
    </article>
  `;
}

function createResourceCard(item) {
  return `
    <article class="card">
      <span class="tag">Resource</span>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </article>
  `;
}

async function loadHome() {
  const target = document.getElementById('featured-list');
  if (!target) return;

  try {
    const tutorials = await fetchJson('/tutorials');
    target.innerHTML = tutorials.slice(0, 3).map(createTutorialCard).join('');

    target.querySelectorAll('[data-slug]').forEach((button) => {
      button.addEventListener('click', () => {
        const slug = button.dataset.slug;
        window.location.href = `tutorials.html?lesson=${encodeURIComponent(slug)}`;
      });
    });
  } catch (error) {
    target.innerHTML = '<div class="card"><p>Unable to load tutorial cards right now.</p></div>';
  }
}

async function loadTutorials() {
  const target = document.getElementById('tutorial-list');
  if (!target) return;

  try {
    const tutorials = await fetchJson('/tutorials');
    const query = new URLSearchParams(window.location.search);
    const selectedSlug = query.get('lesson');

    target.innerHTML = tutorials.map((item) => `
      <article class="tutorial-card">
        <div class="tutorial-thumb" aria-label="${item.title} thumbnail"></div>
        <div class="tutorial-body">
          <div class="meta-row">
            <span>${item.category}</span>
            <span>${item.duration}</span>
          </div>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          <div class="step ${selectedSlug === item.slug ? 'active-choice' : ''}">
            <p>${selectedSlug === item.slug ? 'Selected lesson' : 'Included in the guide'}</p>
          </div>
          <button class="btn btn-primary" type="button" data-slug="${item.slug}">Open lesson</button>
        </div>
      </article>
    `).join('');

    target.querySelectorAll('[data-slug]').forEach((button) => {
      button.addEventListener('click', () => {
        const slug = button.dataset.slug;
        window.location.href = `tutorials.html?lesson=${encodeURIComponent(slug)}`;
      });
    });
  } catch (error) {
    target.innerHTML = '<div class="card"><p>Unable to load tutorials.</p></div>';
  }
}

async function loadResources() {
  const target = document.getElementById('resource-list');
  if (!target) return;

  try {
    const resources = await fetchJson('/resources');
    target.innerHTML = resources.map(createResourceCard).join('');
  } catch (error) {
    target.innerHTML = '<div class="card"><p>Unable to load resource tips.</p></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('featured-list')) loadHome();
  if (document.getElementById('tutorial-list')) loadTutorials();
  if (document.getElementById('resource-list')) loadResources();
});
