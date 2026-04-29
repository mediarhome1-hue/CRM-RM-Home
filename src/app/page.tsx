import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { ChevronRight, ArrowRight, Bed, Bath, Square, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      
      {/* Featured Properties Section */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <span className="text-secondary font-bold tracking-widest uppercase text-xs mb-3 block">Destaques</span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary">Imóveis em Destaque</h2>
            </div>
            <button className="flex items-center gap-2 text-primary font-semibold hover:text-secondary transition-colors group">
              Ver todas as propriedades
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PropertyCard 
              title="Edifício Ocean View"
              location="Boa Viagem, Recife"
              price="R$ 1.250.000"
              beds={3}
              baths={2}
              area="120m²"
              image="/prop1.jpg"
              tag="Venda"
            />
            <PropertyCard 
              title="Casa Garden Ville"
              location="Paiva, Cabo"
              price="R$ 3.800.000"
              beds={4}
              baths={5}
              area="450m²"
              image="/prop2.jpg"
              tag="Venda"
            />
            <PropertyCard 
              title="Flat Moderno"
              location="Pina, Recife"
              price="R$ 4.500 /mês"
              beds={1}
              baths={1}
              area="45m²"
              image="/prop3.jpg"
              tag="Aluguel"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-muted">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-16">
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Office" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 glass p-8 rounded-2xl shadow-xl max-w-[240px]">
                <div className="text-4xl font-bold text-primary mb-1">15+</div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Anos de Experiência em Pernambuco</div>
              </div>
            </div>
            
            <div>
              <span className="text-secondary font-bold tracking-widest uppercase text-xs mb-3 block">Sobre a Líder</span>
              <h2 className="text-3xl md:text-5xl font-bold text-primary mb-8 leading-tight">
                Ajudamos você a encontrar o seu lugar no mundo.
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                A Líder Imobiliária PE é referência no mercado imobiliário pernambucano, oferecendo um atendimento personalizado e exclusivo para quem busca comprar, vender ou alugar imóveis de alto padrão.
              </p>
              
              <div className="space-y-6 mb-10">
                <FeatureItem title="Atendimento Especializado" desc="Corretores certificados e profundos conhecedores do mercado local." />
                <FeatureItem title="Jurídico Próprio" desc="Segurança e agilidade em todo o processo documental e contratual." />
                <FeatureItem title="Gestão de Patrimônio" desc="Administração completa de aluguéis com transparência total." />
              </div>

              <button className="btn btn-primary px-8 py-4">
                Conheça Nossa História
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Placeholder */}
      <footer className="bg-primary text-white py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-white text-primary">
                  <Square size={20} />
                </div>
                <span className="text-xl font-bold">LÍDER</span>
              </div>
              <p className="text-white/60 mb-6">
                Excelência e liderança no mercado imobiliário de Pernambuco.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Navegação</h4>
              <ul className="space-y-4 text-white/60">
                <li><a href="#" className="hover:text-secondary">Venda</a></li>
                <li><a href="#" className="hover:text-secondary">Aluguel</a></li>
                <li><a href="#" className="hover:text-secondary">Lançamentos</a></li>
                <li><a href="#" className="hover:text-secondary">Sobre Nós</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Suporte</h4>
              <ul className="space-y-4 text-white/60">
                <li><a href="#" className="hover:text-secondary">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-secondary">Privacidade</a></li>
                <li><a href="#" className="hover:text-secondary">Termos de Uso</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Newsletter</h4>
              <p className="text-white/60 mb-4">Receba as melhores oportunidades.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Seu e-mail" className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 flex-1 outline-none text-white focus:border-secondary" />
                <button className="btn btn-secondary p-2">OK</button>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            © 2026 Líder Imobiliária PE. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </main>
  );
}

const PropertyCard = ({ title, location, price, beds, baths, area, image, tag }: any) => (
  <div className="group rounded-3xl overflow-hidden bg-white shadow-lg border border-border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
    <div className="relative aspect-video overflow-hidden">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute top-4 left-4">
        <span className="bg-white/90 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          {tag}
        </span>
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-center gap-1 text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
        <MapPin size={14} className="text-secondary" />
        {location}
      </div>
      <h3 className="text-xl font-bold text-primary mb-4 group-hover:text-secondary transition-colors">{title}</h3>
      <div className="grid grid-cols-3 gap-4 py-4 border-y border-border mb-6">
        <div className="flex flex-col items-center gap-1">
          <Bed size={18} className="text-primary/40" />
          <span className="text-sm font-bold text-primary">{beds}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Bath size={18} className="text-primary/40" />
          <span className="text-sm font-bold text-primary">{baths}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Square size={16} className="text-primary/40" />
          <span className="text-sm font-bold text-primary">{area}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-secondary">{price}</div>
        <button className="p-2 rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  </div>
);

const FeatureItem = ({ title, desc }: { title: string, desc: string }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
      <ArrowRight size={20} />
    </div>
    <div>
      <h4 className="font-bold text-primary text-lg mb-1">{title}</h4>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  </div>
);
