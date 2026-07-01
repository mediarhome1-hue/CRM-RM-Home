import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import QuemSomos from '@/components/QuemSomos';
import Imoveis from '@/components/Imoveis';
import Eventos from '@/components/Eventos';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <QuemSomos />
      <Imoveis />
      <Eventos />
    </main>
  );
}
