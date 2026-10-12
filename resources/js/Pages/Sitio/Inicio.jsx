import { Head } from '@inertiajs/react';

import SitioHome from '../../Components/Sitio/SitioHome';

export default function Inicio(props) {
    const descripcion =
        'I.E. N° 31501 Sebastián Lorente — institución educativa pública de Huancayo, Junín. Formamos ciudadanos íntegros con valores y excelencia educativa.';

    return (
        <>
            <Head title="Inicio">
                <meta name="description" content={descripcion} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="IE N° 31501 Sebastián Lorente · Huancayo" />
                <meta property="og:description" content={descripcion} />
                <meta property="og:image" content={new URL('/referencial.jpg', window.location.origin).href} />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            <SitioHome {...props} />
        </>
    );
}

