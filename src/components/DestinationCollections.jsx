import {useStore} from '../lib/store';
import {destinations,cityPlaces} from '../../data/city-collections.js';
import {PlaceImage,PhotoCredit} from './JourneyUI';
import {photoFor} from '../data/destination-photos.js';

const cityPhotoKey = {
  Kochi: 'fort-kochi',
  Bengaluru: 'blr-lalbagh',
  Goa: 'goa_palolem_beach',
  Kozhikode: 'ccj-beach',
  Munnar: 'mun-tea',
  Mysuru: 'mys-palace',
};

export default function DestinationCollections({navigate}){
  const s = useStore();
  return (
    <section className="city-discovery" aria-label="Where to next destinations">
      <div className="collection-intro">
        <small className="eyebrow">Six places to begin · one travel companion</small>
        <h1>Where to next?</h1>
        <p>Find your kind of escape. Keep a few favourites and watch your trip take shape.</p>
      </div>
      <div className="destination-collections">
        {destinations.map(c => {
          const photoKey = c.photoId || cityPhotoKey[c.city];
          const photo = photoFor(photoKey) || (c.image ? { image: c.image } : {});
          const count = c.city === 'Kochi' ? 3 : c.city === 'Goa' ? 50 : cityPlaces.filter(p => p.city === c.city).length;
          return (
            <article key={c.city} className="destination-collection">
              <PlaceImage place={{ ...c, ...photo, name: c.city, category: c.art }} />
              <div>
                <small>{c.region} · {count} places</small>
                <h2>{c.city}</h2>
                <p>{c.description}</p>
                <button
                  aria-label={`Explore ${c.city}`}
                  onClick={() => {
                    s.setPrefs({ city: c.city });
                    navigate('discover');
                  }}
                >
                  Explore {c.city} <span aria-hidden="true">↗</span>
                </button>
                <PhotoCredit place={photo} />
              </div>
            </article>
          );
        })}
      </div>
      <p className="collection-note">Curated places, room for detours. Switching cities keeps your saved stops.</p>
    </section>
  );
}
