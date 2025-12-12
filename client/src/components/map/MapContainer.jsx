import { useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import styles from './MapContainer.module.css';

export default function MapContainer() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Ankara koordinatları
    const ankaraCoords = fromLonLat([32.8597, 39.9334]);

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: ankaraCoords,
        zoom: 12,
        minZoom: 11, // Zoom out limitesi
        maxZoom: 18, // Zoom in limitesi
        extent: [
          fromLonLat([31.5, 39.0])[0],
          fromLonLat([31.5, 39.0])[1],
          fromLonLat([34.5, 40.5])[0],
          fromLonLat([34.5, 40.5])[1]
        ] // Ankara bölgesine sınır
      })
    });

    // Dragging'i disable etme (mouse wheel zoom hariç)
    map.getInteractions().forEach((interaction) => {
      if (interaction.constructor.name === 'DragPan') {
        interaction.setActive(false);
      }
      // Zoom kontrol butonlarını gizle
      if (interaction.constructor.name === 'Zoom') {
        interaction.setActive(false);
      }
    });

    // Haritalardaki tüm kontrolleri kaldır
    map.getControls().forEach((control) => {
      map.removeControl(control);
    });

    return () => {
      map.setTarget(null);
    };
  }, []);

  return <div ref={mapRef} className={styles.mapContainer} />;
}
