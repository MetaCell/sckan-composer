

import FitScreenIcon from '@mui/icons-material/FitScreen';

export const sidebarNodes = [

    {
        id: 'autoscale',
        type: 'autoscale',
        name: 'Autoscale',
        icon: <FitScreenIcon />,
        draggable: false,
        preCallback: (event: any, node: any) => {
            console.log("Pre", event, node)
            return true;
        },
        postCallback: (event: any, node: any) => {
            console.log('Post', event, node)
            return true;
        },
    },
];