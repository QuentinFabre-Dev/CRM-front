import React from 'react'

import Timeline from '@material-ui/lab/Timeline';
import TimelineItem from '@material-ui/lab/TimelineItem';
import TimelineSeparator from '@material-ui/lab/TimelineSeparator';
import TimelineConnector from '@material-ui/lab/TimelineConnector';
import TimelineContent from '@material-ui/lab/TimelineContent';
import TimelineDot from '@material-ui/lab/TimelineDot';


export default function timeline(props) {
    return(
        <aside className='flex flex-col overflow-scroll'>
            <div className='bg-orange-500 w-full' style={{backgroundImage:'url("https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80")',backgroundSize:'cover', backgroundPosition:'center'}}>
                <p className='text-white pt-6 text-center font-bold text-xl h-20 bg-blue-800 bg-opacity-75'>Évenement</p>
            </div>
            <div className='flex w-full'>
                <Timeline align="alternate">
                    <TimelineItem>
                        <TimelineSeparator>
                        <TimelineDot variant="outlined" />
                        <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>12 Sept.
                            <p className='text-xs'>Mozzarella cut the cheese roquefort. Rubber cheese edam mozzarella bocconcini cow goat cheese and wine jarlsberg</p>
                        </TimelineContent>
                    </TimelineItem>
                    <TimelineItem>
                        <TimelineSeparator>
                        <TimelineDot variant="" />
                        <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>21 Oct.
                            <p className='text-xs'>Mozzarella cut the cheese roquefort. Rubber cheese edam mozzarella bocconcini cow goat cheese and wine jarlsberg</p>
                        </TimelineContent>
                    </TimelineItem>
                    <TimelineItem>
                        <TimelineSeparator>
                        <TimelineDot variant="outlined" />
                        <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>12 Sept.
                            <p className='text-xs'>Mozzarella cut the cheese roquefort. Rubber cheese edam mozzarella bocconcini cow goat cheese and wine jarlsberg</p>
                        </TimelineContent>
                        
                    </TimelineItem>
                    <TimelineItem>
                        <TimelineSeparator>
                        <TimelineDot variant="outlined" />
                        <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>12 Sept.
                            <p className='text-xs'>Mozzarella cut the cheese roquefort.</p>
                        </TimelineContent>
                        
                    </TimelineItem>
                    

                    
                </Timeline>
            </div>
            
        </aside> 
    )
}