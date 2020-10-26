import React from 'react'
import Divider from '@material-ui/core/Divider';
import StepProgress from '../components/commercial_view_pc/step_progress'
import LeftMenu from '../components/commercial_view_pc/commercial_view_leftMenu'
import StepForm from '../components/MultiStepForm'

import '../scss/Commercial.css'

export default function Commercial() {
    return(
        <div className="app__commercial">
            <StepProgress />
            <div className="flex w-100 ">
                <LeftMenu />
                <StepForm/>
            </div>
            
        </div>
    )
}
