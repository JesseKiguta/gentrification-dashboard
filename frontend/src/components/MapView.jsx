import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import { useEffect, useState } from 'react'

import API from '../api/client'
import 'leaflet/dist/leaflet.css'
export default function MapView() {
    const [geo, setGeo] = useState(null)
    useEffect(() => {
        API.get('/geojson').then(res => setGeo(res.data)).catch(err =>
            console.error(err))
    }, [])
    return (
        <div className="bg-white p-4 rounded shadow">
            <h4 className="font-bold mb-2">Nairobi Subcounty Map</h4>
            <div style={{ height: 400 }}>
                {geo && (
                    <MapContainer style={{ height: '100%' }} center={[-1.28333, 36.81667]}
                        zoom={11} scrollWheelZoom={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/
 {y}.png" />
                        <GeoJSON data={geo} />
                    </MapContainer>
                )}
            </div>
        </div>
    )
}