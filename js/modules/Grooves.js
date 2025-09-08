/**
 * Grooves - Modern groove library management
 * Refactored from legacy grooves.js with improved organization
 */

export class Grooves {
  constructor() {
    this.grooveLibrary = this.initializeGrooveLibrary();
  }

  initializeGrooveLibrary() {
    return {
      'Rock Grooves': {
        'Empty 16th note groove':
          '?TimeSig=4/4&Div=16&Tempo=80&Measures=1&H=|----------------|&S=|----------------|&K=|----------------|',
        '8th Note Rock':
          '?TimeSig=4/4&Div=8&Tempo=80&Measures=1&H=|xxxxxxxx|&S=|--O---O-|&K=|o---o---|',
        '16th Note Rock':
          '?TimeSig=4/4&Div=16&Tempo=80&Measures=1&H=|xxxxxxxxxxxxxxxx|&S=|----O-------O---|&K=|o-------o-------|',
        'Syncopated Hi-hats #1':
          '?TimeSig=4/4&Div=16&Title=Syncopated%20hi-hats%201&Tempo=80&Measures=1&H=|x-xxx-xxx-xxx-xx|&S=|----O-------O---|&K=|o-------o-------|',
        'Syncopated Hi-hats #2':
          '?TimeSig=4/4&Div=16&Title=Syncopated%20hi-hats%202&Tempo=80&Measures=1&H=|xxx-xxx-xxx-xxx-|&S=|----O-------O---|&K=|o-------o-------|',
        'Four on the Floor':
          '?TimeSig=4/4&Div=16&Title=Four%20on%20the%20Floor&Tempo=120&Measures=1&H=|x-x-x-x-x-x-x-x-|&S=|----O-------O---|&K=|o---o---o---o---|',
        'Half Time':
          '?TimeSig=4/4&Div=16&Title=Half%20Time&Tempo=80&Measures=1&H=|xxxxxxxxxxxxxxxx|&S=|--------O-------|&K=|o-------o-------|'
      },
      'Triplet Grooves': {
        'Jazz Shuffle':
          '?TimeSig=4/4&Div=12&Title=Jazz%20Shuffle&Tempo=100&Measures=1&H=|r--r-rr--r-r|&S=|g-gO-gg-gO-g|&K=|o--X--o--X--|',
        'Half Time Shuffle in 8th notes':
          '?TimeSig=4/4&Div=12&Title=Half%20Time%20Shuffle&Swing=0&measures=1&H=|x-xx-xx-xx-x|&S=|-g--g-Og--g-|&K=|------------|',
        'Half Time Shuffle in 16th notes':
          '?TimeSig=4/4&Div=24&Swing=0&Tempo=85&Measures=1&H=|x-xx-xx-xx-xx-xx-xx-xx-x|&S=|-g--g-Og--g--g--g-Og--g-|&K=|------------------------|',
        'Purdie Shuffle':
          '?TimeSig=4/4&Div=12&Swing=0&Tempo=120&Title=Purdie%20Shuffle&Swing=0&measures=1&H=|x-xx-xx-xx-x|&S=|-g--g-Og--g-|&K=|o----o-----o|',
        'Jazz Ride':
          '?TimeSig=4/4&Div=12&Tempo=80&Measures=1&H=|r--r-rr--r-r|&S=|------------|&K=|---x-----x--|',
        'Swing Feel':
          '?TimeSig=4/4&Div=12&Title=Swing%20Feel&Tempo=120&Measures=1&H=|r--r-rr--r-r|&S=|----O-------O---|&K=|o-------o-------|'
      },
      'World Grooves': {
        'Bossa Nova':
          '?TimeSig=4/4&Div=8&Title=Bossa%20Nova&Tempo=140&Measures=2&H=|xxxxxxxx|xxxxxxxx|&S=|x-x--x-x|-x--x-x-|&K=|o-xoo-xo|o-xoo-xo|',
        'Jazz Samba':
          '?TimeSig=4/4&Div=16&Title=Samba&Tempo=80&Measures=1&H=|r-rrr-rrr-rrr-rr|&S=|o-o--o-o-o-oo-o-|&K=|o-xoo-xoo-xoo-xo|',
        Songo:
          '?TimeSig=4/4&Div=16&Title=Songo&Tempo=80&Measures=1&&H=|x---x---x---x---|&S=|--O--g-O-gg--g-g|&K=|---o--o----o--o-|',
        'Afro-Cuban 6/8':
          '?TimeSig=6/8&Div=12&Title=Afro-Cuban%206/8&Tempo=100&Measures=1&H=|x-x-x-x-x-x-|&S=|--O-----O---|&K=|o-----o-----|',
        Reggae:
          '?TimeSig=4/4&Div=16&Title=Reggae&Tempo=80&Measures=1&H=|--x---x---x---x-|&S=|----O-------O---|&K=|o-------o-------|'
      },
      'Foot Ostinatos': {
        Samba:
          '?TimeSig=4/4&Div=16&Title=Samba%20Ostinato&Tempo=60&Swing=0&measures=1&H=|----------------|&S=|----------------|&K=|o-xoo-xoo-xoo-xo|',
        Tumbao:
          '?TimeSig=4/4&Div=16&Title=Tumbao%20Ostinato&Tempo=60&Measures=1&H=|----------------|&S=|----------------|&K=|x--ox-o-x--ox-o-|',
        Baiao:
          '?TimeSig=4/4&Div=16&Title=Baiao%20Ostinato&Tempo=60&Measures=1&H=|----------------|&S=|----------------|&K=|o-xo--X-o-xo--X-|',
        'Linear Foot Pattern':
          '?TimeSig=4/4&Div=16&Title=Linear%20Foot&Tempo=80&Measures=1&H=|----------------|&S=|----------------|&K=|o--o-o--o--o-o--|'
      },
      'Odd Time Signatures': {
        '5/4 Groove':
          '?TimeSig=5/4&Div=16&Title=5/4%20Groove&Tempo=100&Measures=1&H=|x-x-x-x-x-x-x-x-x-x-|&S=|----O-------O-------|&K=|o-------o-------o---|',
        '7/8 Groove':
          '?TimeSig=7/8&Div=16&Title=7/8%20Groove&Tempo=120&Measures=1&H=|x-x-x-x-x-x-x-|&S=|----O-----O---|&K=|o-----o-------|',
        '3/4 Waltz':
          '?TimeSig=3/4&Div=8&Title=3/4%20Waltz&Tempo=120&Measures=1&H=|xxxxxx|&S=|--O---|&K=|o-----|'
      },
      'Linear Grooves': {
        'Linear 16th #1':
          '?TimeSig=4/4&Div=16&Title=Linear%2016th%20%231&Tempo=100&Measures=1&H=|x---x---x---x---|&S=|--O---O---O---O-|&K=|----o-------o---|',
        'Linear 16th #2':
          '?TimeSig=4/4&Div=16&Title=Linear%2016th%20%232&Tempo=100&Measures=1&H=|x-x---x-x---x-x-|&S=|---O-------O----|&K=|o-------o-------|',
        'Linear Triplets':
          '?TimeSig=4/4&Div=12&Title=Linear%20Triplets&Tempo=100&Measures=1&H=|x--x--x--x--|&S=|--O----O----|&K=|o----o----o-|'
      }
    };
  }

  // Get all grooves as nested object
  getAllGrooves() {
    return this.grooveLibrary;
  }

  // Get grooves by category
  getGroovesByCategory(category) {
    return this.grooveLibrary[category] || {};
  }

  // Get all category names
  getCategories() {
    return Object.keys(this.grooveLibrary);
  }

  // Search grooves by name
  searchGrooves(searchTerm) {
    const results = {};
    const lowerSearchTerm = searchTerm.toLowerCase();

    Object.entries(this.grooveLibrary).forEach(([category, grooves]) => {
      const matchingGrooves = {};

      Object.entries(grooves).forEach(([name, data]) => {
        if (name.toLowerCase().includes(lowerSearchTerm)) {
          matchingGrooves[name] = data;
        }
      });

      if (Object.keys(matchingGrooves).length > 0) {
        results[category] = matchingGrooves;
      }
    });

    return results;
  }

  // Get random groove
  getRandomGroove() {
    const categories = this.getCategories();
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const grooves = this.getGroovesByCategory(randomCategory);
    const grooveNames = Object.keys(grooves);
    const randomGrooveName = grooveNames[Math.floor(Math.random() * grooveNames.length)];

    return {
      category: randomCategory,
      name: randomGrooveName,
      data: grooves[randomGrooveName]
    };
  }

  // Add custom groove
  addCustomGroove(category, name, data) {
    if (!this.grooveLibrary[category]) {
      this.grooveLibrary[category] = {};
    }
    this.grooveLibrary[category][name] = data;
  }

  // Remove groove
  removeGroove(category, name) {
    if (this.grooveLibrary[category] && this.grooveLibrary[category][name]) {
      delete this.grooveLibrary[category][name];

      // Remove category if empty
      if (Object.keys(this.grooveLibrary[category]).length === 0) {
        delete this.grooveLibrary[category];
      }

      return true;
    }
    return false;
  }

  // Generate HTML for groove list (backward compatibility)
  getGroovesAsHTML() {
    return this.generateGrooveListHTML(this.grooveLibrary);
  }

  // Generate HTML for specific grooves
  generateGrooveListHTML(grooves) {
    let html = '<ul class="grooveListUL">\n';

    Object.entries(grooves).forEach(([category, categoryGrooves]) => {
      if (this.isObject(categoryGrooves)) {
        html += `<li class="grooveListHeaderLI">${category}</li>\n`;
        html += this.generateGrooveListHTML(categoryGrooves);
      } else {
        // Individual groove
        html += `<li class="grooveListLI" onclick="myGrooveWriter.loadNewGroove('${categoryGrooves}')">${category}</li>\n`;
      }
    });

    html += '</ul>\n';
    return html;
  }

  // Generate modern HTML with better structure
  generateModernGrooveListHTML() {
    const container = document.createElement('div');
    container.className = 'groove-library';

    Object.entries(this.grooveLibrary).forEach(([category, grooves]) => {
      const categorySection = this.createCategorySection(category, grooves);
      container.appendChild(categorySection);
    });

    return container;
  }

  createCategorySection(category, grooves) {
    const section = document.createElement('div');
    section.className = 'groove-category';

    const header = document.createElement('h3');
    header.className = 'groove-category-header';
    header.textContent = category;
    header.addEventListener('click', () => this.toggleCategory(section));

    const list = document.createElement('ul');
    list.className = 'groove-list';

    Object.entries(grooves).forEach(([name, data]) => {
      const item = this.createGrooveItem(name, data);
      list.appendChild(item);
    });

    section.appendChild(header);
    section.appendChild(list);

    return section;
  }

  createGrooveItem(name, data) {
    const item = document.createElement('li');
    item.className = 'groove-item';

    const button = document.createElement('button');
    button.className = 'groove-button';
    button.textContent = name;
    button.addEventListener('click', () => this.loadGroove(data));

    // Add preview functionality
    const previewButton = document.createElement('button');
    previewButton.className = 'groove-preview-button';
    previewButton.innerHTML = '<i class="fa fa-play"></i>';
    previewButton.title = 'Preview groove';
    previewButton.addEventListener('click', e => {
      e.stopPropagation();
      this.previewGroove(data);
    });

    item.appendChild(button);
    item.appendChild(previewButton);

    return item;
  }

  toggleCategory(section) {
    const list = section.querySelector('.groove-list');
    const header = section.querySelector('.groove-category-header');

    if (list.style.display === 'none') {
      list.style.display = 'block';
      header.classList.remove('collapsed');
    } else {
      list.style.display = 'none';
      header.classList.add('collapsed');
    }
  }

  loadGroove(data) {
    if (window.myGrooveWriter) {
      window.myGrooveWriter.loadNewGroove(data);
    }
  }

  previewGroove(data) {
    // Implement groove preview functionality
    console.log('Preview groove:', data);
    // This could load the groove temporarily and play a short preview
  }

  // Utility methods
  isObject(obj) {
    return obj && typeof obj === 'object' && obj.constructor === Object;
  }

  // Export/Import functionality
  exportGrooves() {
    return JSON.stringify(this.grooveLibrary, null, 2);
  }

  importGrooves(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      this.grooveLibrary = { ...this.grooveLibrary, ...imported };
      return true;
    } catch (error) {
      console.error('Failed to import grooves:', error);
      return false;
    }
  }

  // Save/Load from localStorage
  saveToLocalStorage() {
    try {
      localStorage.setItem('customGrooves', this.exportGrooves());
      return true;
    } catch (error) {
      console.error('Failed to save grooves to localStorage:', error);
      return false;
    }
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('customGrooves');
      if (saved) {
        return this.importGrooves(saved);
      }
    } catch (error) {
      console.error('Failed to load grooves from localStorage:', error);
    }
    return false;
  }
}
