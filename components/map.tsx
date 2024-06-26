"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription } from "@/components/ui/alert-dialog"
import { DrawingPinFilledIcon, TrashIcon, DownloadIcon, UploadIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"


import { MapContainer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LatLngExpression, BoundsExpression } from 'leaflet';
import { ImageOverlay } from 'react-leaflet';
import L from 'leaflet';

import React, { useState, useEffect } from 'react';
import mapData from '../app/data_map.json';
import '../app/map.css';

// Function to generate icon based on parameters
const createIcon = (iconUrl: string, shadowUrl: string, iconSize: [number, number]) => L.icon({
    iconUrl,
    shadowUrl,
    iconSize
});

// Icon definitions 
const cityIconPath = 'city.png';
const townIconPath = 'town.png';
const eventIconPath = 'dice.png';
const shadowIconPath = 'marker-shadow.webp';
const IconCity = createIcon(cityIconPath, shadowIconPath, [24, 36]);
const IconCityHovered = createIcon(cityIconPath, shadowIconPath, [30, 45]);
const IconTown = createIcon(townIconPath, shadowIconPath, [24, 36]);
const IconTownHovered = createIcon(townIconPath, shadowIconPath, [30, 45]);
const IconEvent = createIcon(eventIconPath, shadowIconPath, [24, 36]);
const IconEventHovered = createIcon(eventIconPath, shadowIconPath, [30, 45]);

// Pin information properties
interface PinInfoProps {
    id: string;
    name: string;
    description: string;
    type: string;
    onHover: (id: string) => void;
    onHoverEnd: () => void;
}


// Marker information structure
interface MarkerInfo {
    id: string;
    location: [number, number];
    type: string;
    name: string;
    description: string;
}

// Tooltip properties
interface TooltipProps {
    id: string;
    name: string;
    description: string;
    type: string;
    position: [number, number];
    isHovered: boolean;
}

// Mapping for hovered and non-hovered icons
const icons: Record<string, { normal: L.Icon; hovered: L.Icon }> = {
    town: { normal: IconTown, hovered: IconTownHovered },
    event: { normal: IconEvent, hovered: IconEventHovered },
    city: { normal: IconCity, hovered: IconCityHovered }
};


// Single map marker component
const MapMarker: React.FC<TooltipProps> = ({ id, name, description, type, position, isHovered }) => {
    const iconSet = icons[type] || icons.city;
    const icon = isHovered ? iconSet.hovered : iconSet.normal;
    let border_color = `${type === 'town' ? 'border-red-500' : type === 'event' ? 'border-blue-500' : type === 'city' ? 'border-green-500' : ''}`;


    return (
        <Marker position={position} icon={icon}>
            <Popup>
                <div className={`profile-card rounded-lg p-2 -mx-8 -my-4 min-w-[10rem] max-w-[20vw] bg-gradient-to-b from-neutral-200 to-neutral-100 border-b-2 border-x-2 ${border_color}`}>
                    <h2 className="text-xl font-bold text-neutral-900 pb-1">{name || <Skeleton className="h-6 w-[7rem]" />}</h2>
                    {description || <Skeleton className="h-4 w-[9rem]" />}
                </div>
            </Popup>
        </Marker>
    );
};


// Main map component
const Map: React.FC<{ initialMarkerLocations?: MarkerInfo[] }> = ({ initialMarkerLocations = [] }) => {
    const [markerLocations, setMarkerLocations] = useState<MarkerInfo[]>(initialMarkerLocations);
    const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

    const handleHover = (id: string) => setHoveredMarkerId(id);
    const handleHoverEnd = () => setHoveredMarkerId(null);

    const deletePin = (id: string) => {
        setMarkerLocations(prevLocations => prevLocations.filter(marker => marker.id !== id));
    };

    const updatePin = (id: string, field: string, value: string) => {
        setMarkerLocations(prevLocations => prevLocations.map(marker => marker.id === id ? { ...marker, [field]: value } : marker));
    };

    const saveMarkersToFile = () => {
        const jsonMarkers = JSON.stringify(markerLocations, null, 2);
        navigator.clipboard.writeText(jsonMarkers);
        alert('Markers copied to clipboard. Paste it into a file to save.');
    };

    // take json map data from file and load it
    useEffect(() => {
        setMarkerLocations(mapData.map(marker => ({
            ...marker,
            location: [marker.location[0], marker.location[1]]
        })));
    }, []);

    const [textareaValue, setTextareaValue] = useState('');

    const handleTextareaChange = (event: any) => {
        setTextareaValue(event.target.value);
    };

    const handleContinueClick = () => {
        try {
            const markers = JSON.parse(textareaValue);
            setMarkerLocations(markers);
        } catch (error) {
            console.error('Invalid JSON data');
        }
    };

    const togglePinInfo = () => {
        const pinInfo = document.querySelectorAll('#PinInfo');
        pinInfo.forEach((info) => {
            info.classList.toggle('hidden');
        });
    };

    return (
        <div className="w-full max-w-[75%] mx-auto py-4">
            <BaseMap markerLocations={markerLocations} setMarkerLocations={setMarkerLocations} hoveredMarkerId={hoveredMarkerId} />
            <div className="items-center justify-between flex flex-row gap-2 mt-2 pb-2">
                <button aria-label="Download Markers" className="bg-neutral-300 dark:bg-neutral-500 text-neutral-900 dark:text-white rounded-sm flex flex-row items-center px-1 py-0 shadow-md shadow-neutral-700/40 hover:scale-105" onClick={saveMarkersToFile}>
                    <DownloadIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all mr-1" />  Copy Map Markers
                </button>
                <button aria-label="Show/Hide Pin Info" className="bg-neutral-300 dark:bg-neutral-500 text-neutral-900 dark:text-white rounded-sm flex flex-row items-center px-1 py-0 shadow-md shadow-neutral-700/40 hover:scale-105" onClick={togglePinInfo}>
                    <MagnifyingGlassIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all mr-1" />  Toggle Marker Info
                </button>
                <AlertDialog >
                    <AlertDialogTrigger>
                        <button aria-label="Upload Markers" className="bg-neutral-300 dark:bg-neutral-500 text-neutral-900 dark:text-white rounded-sm flex flex-row items-center px-1 py-0 shadow-md shadow-neutral-700/40 hover:scale-105">
                            <UploadIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all mr-1" />  Add Markers to Map
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Paste the JSON text</AlertDialogTitle>
                            <AlertDialogDescription>
                                This takse your text, parses it as JSON, and <span className="font-bold"> replaces </span> the current markers with these.
                                <Textarea id="description" className="rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-1 h-[33vh]"
                                    value={textareaValue}
                                    onChange={handleTextareaChange} />
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleContinueClick}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <div id="PinInfo" className="flex flex-col gap-2 grid xl:grid-cols-2 min-[2050px]:grid-cols-3 max-lg:grid-cols-1 hidden">
                {markerLocations.map((marker, index) => (
                    <PinInfo key={index} {...marker} onHover={handleHover} onHoverEnd={handleHoverEnd} onDelete={deletePin} onUpdate={updatePin} />
                ))}
            </div>
        </div>
    );
};

// PinInfo component with delete functionality
const PinInfo: React.FC<PinInfoProps & { onDelete: (id: string) => void, onUpdate: (id: string, name: string, description: string) => void }> = ({ id, name, description, type, onHover, onHoverEnd, onDelete, onUpdate }) => {

    const handleDelete = () => {
        onDelete(id); // Call the delete function with pin ID
    };

    const handleUpdate = (field: string, value: string) => {
        onUpdate(id, field, value); // Call the update function with pin ID, field, and new value
    };

    let type_color = `${type === 'town' ? 'bg-red-500' : type === 'event' ? 'bg-blue-500' : type === 'city' ? 'bg-green-500' : ''}`;

    return (
        <div className="w-full mx-auto p-2 bg-neutral-400 dark:bg-neutral-700 rounded-lg flex flex-col gap-2" onMouseEnter={() => onHover(id)} onMouseLeave={onHoverEnd}>
            <div className="flex">
                <div className="flex flex-row gap-1 justify-between items-between w-full">
                    <Input type="text" id="name" className="input-text rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-1"
                        defaultValue={name} placeholder="Name" onChange={(e) => handleUpdate('name', e.target.value)} />
                    <div className="flex flex-row gap-2 justify-between items-center">
                        <select value={type} onChange={(e) => handleUpdate('type', e.target.value)}
                            className={`h-6 rounded-lg px-2 py-1 align-baseline text-xs font-bold uppercase leading-none text-white flex items-center justify-center ${type_color} focus:outline-none focus:ring-2 focus:ring-blue-100`}>
                            <option value="city" className="bg-green-500">City</option>
                            <option value="town" className="bg-red-500">Town</option>
                            <option value="event" className="bg-blue-500">Event</option>
                        </select>
                        <AlertDialog>
                            <AlertDialogTrigger>
                                <button aria-label="Delete Pin" className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500" >
                                    <TrashIcon className=" rotate-0 scale-100 transition-all" />
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this pin?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <Textarea id="description" className="rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-1 min-h-[3rem]"
                    defaultValue={description} placeholder="Description" style={{ resize: 'none' }} onChange={(e) => handleUpdate('description', e.target.value)} />
            </div>
        </div >
    );
};

// Base map with click handler and overlay
const BaseMap: React.FC<{ markerLocations: MarkerInfo[], setMarkerLocations: React.Dispatch<React.SetStateAction<MarkerInfo[]>>, hoveredMarkerId: string | null }> = ({ markerLocations, setMarkerLocations, hoveredMarkerId }) => {
    const [currentAction, setCurrentAction] = useState<string>('');
    const editMarker = () => setCurrentAction('marker');

    useEffect(() => {
        if (currentAction === 'marker') {
            const leafletContainer = document.querySelector('.leaflet-container');
            if (leafletContainer) {
                leafletContainer.classList.add('crosshair-cursor-enabled');
            }
        } else {
            const leafletContainer = document.querySelector('.leaflet-container');
            if (leafletContainer) {
                leafletContainer.classList.remove('crosshair-cursor-enabled');
            }
        }
    }, [currentAction]);

    function ClickHandler() {
        useMapEvents({
            click(event) {
                if (currentAction === 'marker') {
                    const { lat, lng } = event.latlng;
                    const newId = `marker-${Date.now()}`;
                    setMarkerLocations(prevLocations => [
                        ...prevLocations,
                        {
                            id: newId,
                            location: [lat + 0.00005, lng], // + x so location clicked is the bottom of the marker
                            type: 'event',
                            name: '',
                            description: ''
                        }
                    ]);
                    setCurrentAction('');
                }
            }
        });
        return null;
    }

    const position: LatLngExpression = [0.04000, 0.08000];
    const bounds: BoundsExpression = [[0, 0], [0.08000, 0.16000]];

    return (
        <MapContainer
            center={position}
            scrollWheelZoom={true}
            style={{ height: '67vh', width: '100%' }}
            className="rounded-lg border border-transparent bg-neutral-100 dark:bg-neutral-900"
            zoom={14}
            minZoom={13}
            maxZoom={17}
            maxBounds={[[-.01, -.01], [0.09000, 0.17000]]}
        >
            <ImageOverlay bounds={bounds} url="/map.webp" />
            <ClickHandler />
            <div id="buttons" className="btn-group">
                <Button aria-label="Add Marker" title="Add Marker" onClick={editMarker} className="editable-btn absolute top-5 right-0 bg-white p-2 rounded-sm hover:bg-neutral-200" size="sm">
                    <DrawingPinFilledIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" color="black" />
                </Button>
            </div>
            <div id="markers">
                {markerLocations.map((marker, index) => (
                    <MapMarker key={index} id={marker.id} position={marker.location} type={marker.type} name={marker.name} description={marker.description} isHovered={marker.id === hoveredMarkerId} />
                ))}
            </div>
        </MapContainer>
    );
};

export default Map;
