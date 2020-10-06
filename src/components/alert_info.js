import React from 'react'
import AnnouncementIcon from '@material-ui/icons/Announcement';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';

export default function alert_info() {
    return(
        <div className='flex bg-white text-gray-500 py-3 px-2 rounded-lg'>
            <AnnouncementIcon style={{ color: "#e74c3c",marginRight:10,marginLeft:10,}} />
            <p className='flex-1'>Penser à remplir la grille d'audite avant la fin de la semaine !</p>
            <HighlightOffIcon style={{ color: "#a0aec0", marginRight:10,marginLeft:10}} />
        </div>
    )
}