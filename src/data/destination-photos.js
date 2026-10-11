// Licensed photographs, served locally. Original sources and licences travel with the app.
export const destinationPhotos = {
  // Goa
  goa_anjuna_beach: {
    image: '/assets/destinations/anjuna.jpg',
    photoAuthor: 'Nikhil B / Wikimedia Commons',
    photoLicense: 'CC BY 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Anjuna_Beach_2_25012016.jpg'
  },
  goa_palolem_beach: {
    image: '/assets/destinations/palolem.jpg',
    photoAuthor: 'iMahesh',
    photoLicense: 'CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Palolem_Beach,_South_Goa.jpg'
  },
  goa_baga_beach: {
    image: '/assets/destinations/baga.jpg',
    photoAuthor: 'Wikimedia Commons',
    photoLicense: 'CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Baga_Beach,_Goa.jpg'
  },
  goa_fort_aguada: {
    image: '/assets/destinations/aguada.jpg',
    photoAuthor: 'Nishith Jayaram',
    photoLicense: 'CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:FortAguada.jpg'
  },
  goa_chapora_fort: {
    image: '/assets/destinations/chapora.jpg',
    photoAuthor: 'Wikimedia Commons',
    photoLicense: 'CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Chapora_Fort.jpg'
  },
  goa_fontainhas: {
    image: '/assets/destinations/fontainhas.jpg',
    photoAuthor: 'Vinayaraj',
    photoLicense: 'CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Fontainhas_Goa_vrvbgoa2k24_(1).jpg'
  },
  goa_mangueshi_temple: {
    image: '/assets/destinations/mangueshi.jpg',
    photoAuthor: 'Wikimedia Commons',
    photoLicense: 'CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Mangueshi_temple.jpg'
  },
  goa_saturday_night_market: {
    image: '/assets/destinations/market.jpg',
    photoAuthor: 'Wikimedia Commons',
    photoLicense: 'CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Anjuna_Flea_Market,_January,_2018-1.jpg'
  },
  goa_anjuna_flea_market: {
    image: '/assets/destinations/market.jpg',
    photoAuthor: 'Wikimedia Commons',
    photoLicense: 'CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Anjuna_Flea_Market,_January,_2018-1.jpg'
  },

  // Bengaluru
  'blr-lalbagh': {
    image: '/assets/destinations/lalbagh.jpg',
    photoAuthor: 'Kprateek88',
    photoLicense: 'CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Glass_house_in_Lalbagh,_Bangalore_(rotated).JPG'
  },

  // Mysuru
  'mys-palace': {
    image: '/assets/destinations/mysore-palace.jpg',
    photoAuthor: 'Muhammad Mahdi Karim',
    photoLicense: 'CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Mysore_Palace.jpg'
  },

  // Munnar
  'mun-tea': {
    image: '/assets/destinations/munnar-tea.jpg',
    photoAuthor: 'Bimal K C',
    photoLicense: 'CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Munnar_Tea_Plantation.jpg'
  },
  'mun-eravikulam': {
    image: '/assets/destinations/munnar-tea.jpg',
    photoAuthor: 'Bimal K C',
    photoLicense: 'CC BY-SA 3.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Munnar_Tea_Plantation.jpg'
  },

  // Kozhikode
  'ccj-beach': {
    image: '/assets/destinations/kozhikode-beach.jpg',
    photoAuthor: 'Vaisakh Kallore',
    photoLicense: 'CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Kozhikode_Beach_Coastline.jpg'
  },
  'ccj-kappad': {
    image: '/assets/destinations/kozhikode-beach.jpg',
    photoAuthor: 'Vaisakh Kallore',
    photoLicense: 'CC BY-SA 4.0',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Kozhikode_Beach_Coastline.jpg'
  },

  // Kochi
  'fort-kochi': {
    image: '/assets/fort-kochi.jpg',
    photoAuthor: 'Pico Archive',
    photoLicense: 'Editorial',
    photoSource: '/assets/fort-kochi.jpg'
  },
  kumbalangi: {
    image: '/assets/kumbalangi.jpg',
    photoAuthor: 'Pico Archive',
    photoLicense: 'Editorial',
    photoSource: '/assets/kumbalangi.jpg'
  },
  kashi: {
    image: '/assets/kashi.jpg',
    photoAuthor: 'Pico Archive',
    photoLicense: 'Editorial',
    photoSource: '/assets/kashi.jpg'
  }
};

export const photoFor = id => destinationPhotos[id] || {};
