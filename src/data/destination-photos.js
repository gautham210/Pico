// Licensed photographs, served locally. Original sources and licences travel with the app.
export const destinationPhotos={
 goa_anjuna_beach:{image:'/assets/destinations/anjuna.jpg',photoAuthor:'Nikhil B / Wikimedia Commons',photoLicense:'CC BY 3.0',photoSource:'https://commons.wikimedia.org/wiki/File:Anjuna_Beach_2_25012016.jpg'},
 'blr-lalbagh':{image:'/assets/destinations/lalbagh.jpg',photoAuthor:'Kprateek88',photoLicense:'CC BY-SA 3.0',photoSource:'https://commons.wikimedia.org/wiki/File:Glass_house_in_Lalbagh,_Bangalore_(rotated).JPG'},
 goa_palolem_beach:{image:'/assets/destinations/palolem.jpg',photoAuthor:'iMahesh',photoLicense:'CC BY-SA 4.0',photoSource:'https://commons.wikimedia.org/wiki/File:Palolem_Beach,_South_Goa.jpg'},
 goa_fort_aguada:{image:'/assets/destinations/aguada.jpg',photoAuthor:'Nishith Jayaram',photoLicense:'CC BY-SA 3.0',photoSource:'https://commons.wikimedia.org/wiki/File:FortAguada.jpg'},
};
export const photoFor=id=>destinationPhotos[id]||{};
