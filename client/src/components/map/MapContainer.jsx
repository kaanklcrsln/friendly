import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../utils/adminConfig';
import styles from './MapContainer.module.css';

export default function MapContainer() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapType, setMapType] = useState('roadmap');
  const [events, setEvents] = useState([]);
  const markersRef = useRef([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!mapRef.current) return;

    // Ankara koordinatları
    const ankaraCoords = { lat: 39.9334, lng: 32.8597 };

    // Google Maps API'ı kontrol et ve harita oluştur
    if (window.google && window.google.maps) {
      initializeMap(ankaraCoords);
    } else {
      // API henüz yüklenmemişse bekle
      const checkApi = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkApi);
          initializeMap(ankaraCoords);
        }
      }, 100);
    }

    function initializeMap(coords) {
      // Ankara sınırları (daha hassas)
      const ankaraBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(39.4, 32.4), // Southwest (güneybatı)
        new window.google.maps.LatLng(42.5, 36.3)   // Northeast (kuzeydoğu)
      );

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 11,
        center: coords,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.LEFT_TOP
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.LEFT_TOP
        },
        mapTypeControl: false,
        fullscreenControl: false,
        rotateControl: false,
        scaleControl: false,
        panControl: false,
        minZoom: 11,
        maxZoom: 18,
        restriction: {
          latLngBounds: ankaraBounds,
          strictBounds: false
        }
      });

      // Bounds değiştiğinde kontrol et
      map.addListener('bounds_changed', () => {
        const bounds = map.getBounds();
        if (bounds && !ankaraBounds.contains(bounds.getCenter())) {
          map.fitBounds(ankaraBounds);
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({ lat: 39.9334, lng: 32.8597 });
      }
    };
  }, []);

  // Firebase'den etkinlikleri yükle
  useEffect(() => {
    const eventsRef = ref(rtdb, 'events');
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const eventsData = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const eventData = child.val();
          // Silinen etkinlikleri gizle (normal kullanıcılar için)
          if (eventData.isDeleted && !isAdmin(user?.email)) {
            return;
          }
          if (eventData.coordinates) {
            eventsData.push({
              id: child.key,
              ...eventData
            });
          }
        });
      }
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Etkinlik markerlarını haritaya ekle
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Önceki markerları temizle
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Yeni markerları ekle
    events.forEach(event => {
      if (event.coordinates) {
        // Koordinatları normalize et (Firebase'den gelen veri lat/lng şeklinde)
        const position = {
          lat: typeof event.coordinates.lat === 'function' ? event.coordinates.lat() : event.coordinates.lat,
          lng: typeof event.coordinates.lng === 'function' ? event.coordinates.lng() : event.coordinates.lng
        };

        const userParticipationStatus = user && event.participation ? event.participation[user.uid] : null;

        const marker = new window.google.maps.Marker({
          position: position,
          map: mapInstanceRef.current,
          title: event.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4a7ab5" width="32" height="32">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }
        });

        // InfoWindow ekle
        const adminBadge = isAdmin(event.createdByEmail) ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="display: inline-block; width: 18px; height: 18px; color: #4a7ab5; margin-left: 8px; flex-shrink: 0;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>' : '';
        const infoWindowContent = `
          <div style="padding: 12px; min-width: 250px; font-family: Arial, sans-serif;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <h3 style="margin: 0; color: #2d3748; font-size: 14px;">${event.title}</h3>
              ${adminBadge}
            </div>
            <p style="margin: 4px 0; color: #4a5568; font-size: 12px;">${event.description}</p>
            <p style="margin: 4px 0; font-weight: bold; color: #4a7ab5; font-size: 12px;">📍 ${event.location}</p>
            <p style="margin: 4px 0; color: #4a5568; font-size: 12px;">📅 ${event.date} | ⏰ ${event.time}</p>
            <p style="margin: 8px 0 0 0; color: #4a5568; font-size: 12px;">👥 ${event.participantCount || 1} kişi</p>
            <div style="display: flex; gap: 8px; margin-top: 10px;">
              <button id="approveBtn-${event.id}" style="flex: 1; padding: 6px 8px; border: none; border-radius: 4px; background: ${userParticipationStatus === 'approved' ? '#4a7ab5' : '#e2e8f0'}; color: ${userParticipationStatus === 'approved' ? 'white' : '#2d3748'}; cursor: pointer; font-size: 11px; font-weight: 500;">✓ Katılacağım</button>
              <button id="rejectBtn-${event.id}" style="flex: 1; padding: 6px 8px; border: none; border-radius: 4px; background: ${userParticipationStatus === 'rejected' ? '#e53e3e' : '#e2e8f0'}; color: ${userParticipationStatus === 'rejected' ? 'white' : '#2d3748'}; cursor: pointer; font-size: 11px; font-weight: 500;">✕ Katılmayacağım</button>
            </div>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoWindowContent
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
          
          // İkonlara event listener ekle
          setTimeout(() => {
            const approveBtn = document.getElementById(`approveBtn-${event.id}`);
            const rejectBtn = document.getElementById(`rejectBtn-${event.id}`);
            
            if (approveBtn) {
              approveBtn.addEventListener('click', async () => {
                if (user) {
                  try {
                    await update(ref(rtdb, `events/${event.id}`), {
                      [`participation/${user.uid}`]: 'approved'
                    });
                  } catch (error) {
                    console.error('Katılım durumu güncellenirken hata:', error);
                  }
                }
              });
            }
            
            if (rejectBtn) {
              rejectBtn.addEventListener('click', async () => {
                if (user) {
                  try {
                    await update(ref(rtdb, `events/${event.id}`), {
                      [`participation/${user.uid}`]: 'rejected'
                    });
                  } catch (error) {
                    console.error('Katılım durumu güncellenirken hata:', error);
                  }
                }
              });
            }
          }, 0);
        });

        markersRef.current.push(marker);
      }
    });
  }, [events, user]);

  // Global etkinlik zoomlama fonksiyonu
  useEffect(() => {
    window.focusEventOnMap = (eventId) => {
      console.log('MapContainer: Etkinlik zoomlanıyor:', eventId);
      const targetEvent = events.find(e => e.id === eventId);
      if (targetEvent && targetEvent.coordinates && mapInstanceRef.current) {
        console.log('MapContainer: Etkinlik bulundu, zoomlaniyor:', targetEvent);
        const position = {
          lat: typeof targetEvent.coordinates.lat === 'function' ? targetEvent.coordinates.lat() : targetEvent.coordinates.lat,
          lng: typeof targetEvent.coordinates.lng === 'function' ? targetEvent.coordinates.lng() : targetEvent.coordinates.lng
        };
        
        // Haritayı etkinlik konumuna zoom yap
        mapInstanceRef.current.setCenter(position);
        mapInstanceRef.current.setZoom(16);
        
        // Etkinlik marker'ını bul ve InfoWindow aç
        const targetMarker = markersRef.current.find((marker, index) => {
          const markerEvent = events[index];
          return markerEvent && markerEvent.id === eventId;
        });
        
        if (targetMarker) {
          console.log('MapContainer: Marker bulundu, InfoWindow açılıyor');
          // Marker'ı tıkla (InfoWindow açar)
          window.google.maps.event.trigger(targetMarker, 'click');
        }
      } else {
        console.log('MapContainer: Etkinlik bulunamadı veya harita hazır değil:', { eventId, targetEvent, mapReady: !!mapInstanceRef.current });
      }
    };

    // Cleanup
    return () => {
      delete window.focusEventOnMap;
    };
  }, [events]);

  const changeMapType = (type) => {
    setMapType(type);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapRef} className={styles.mapContainer} />
      
      {/* Layer Selection Button - Top Right */}
      <div className={styles.layerControl}>
        <button
          className={`${styles.layerBtn} ${mapType === 'satellite' ? styles.active : ''}`}
          onClick={() => changeMapType('satellite')}
          title="Uydu Görüntüsü"
        >
          Uydu 
        </button>
        <button
          className={`${styles.layerBtn} ${mapType === 'roadmap' ? styles.active : ''}`}
          onClick={() => changeMapType('roadmap')}
          title="Harita"
        >
          Harita
        </button>
      </div>

      {/* Footer Attribution - Bottom Right */}
      <div className={styles.mapFooter}>
        FriendlyGIS by kaanklcrsln
      </div>
    </div>
  );
}
