import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'AI-Powered Detection',
    emoji: '🤖',
    description: (
      <>
        Menggunakan teknologi Computer Vision dan Machine Learning untuk mendeteksi
        kondisi kesehatan kucing dengan akurasi tinggi melalui analisis gambar wajah.
      </>
    ),
  },
  {
    title: 'Multi-Area Analysis',
    emoji: '🔍',
    description: (
      <>
        Analisis detail pada berbagai area wajah kucing: mata kiri & kanan, telinga
        kiri & kanan, dan mulut untuk deteksi yang lebih komprehensif.
      </>
    ),
  },
  {
    title: 'RESTful API',
    emoji: '⚡',
    description: (
      <>
        API yang mudah diintegrasikan dengan dokumentasi lengkap untuk ML Service
        dan Storage Service yang dapat digunakan dalam aplikasi Anda.
      </>
    ),
  },
  {
    title: 'Real-time Processing',
    emoji: '🚀',
    description: (
      <>
        Proses deteksi yang cepat dengan hasil instan. Upload foto kucing dan
        dapatkan hasil analisis dalam hitungan detik.
      </>
    ),
  },
  {
    title: 'Comprehensive Documentation',
    emoji: '📚',
    description: (
      <>
        Dokumentasi lengkap dengan contoh kode, API reference, dan panduan
        integrasi untuk memudahkan developer menggunakan ResCAT.
      </>
    ),
  },
  {
    title: 'Cloud Storage',
    emoji: '☁️',
    description: (
      <>
        Sistem penyimpanan file terorganisir dengan bucket management untuk
        menyimpan foto original, hasil crop, dan hasil analisis.
      </>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center" style={{fontSize: '4rem', marginBottom: '1rem'}}>
        {emoji}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="text--center" style={{marginBottom: '3rem'}}>
          <Heading as="h2" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>
            Mengapa ResCAT?
          </Heading>
          <p style={{fontSize: '1.25rem', color: 'var(--ifm-color-emphasis-600)'}}>
            Platform lengkap untuk deteksi kesehatan kucing dengan teknologi AI
          </p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
