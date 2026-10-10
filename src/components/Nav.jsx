import wordmark from '../../Logo.png';
import {profileImage} from '../data/places';
export default function Nav({title='Pico'}){return <header className="app-header"><a href="#home" aria-label="Pico home"><span className="pico-wordmark"><img src={wordmark} alt="Pico"/></span></a><span className="screen-title">{title}</span><a href="#dna" aria-label="Your Travel DNA"><img className="avatar" src={profileImage} alt="Demo traveller profile"/></a></header>;}
