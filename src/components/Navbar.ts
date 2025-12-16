export class Navbar {
    mount(container: HTMLElement) {
        const nav = document.createElement('nav');
        nav.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(5px);
            border-bottom: 1px solid rgba(214, 51, 132, 0.2);
            position: sticky;
            top: 0;
            z-index: 1000;
            flex-wrap: wrap;
            gap: 10px;
        `;

        const links = [
            { name: '合成版', path: '/' },
            { name: '2048版', path: '/2048' },
            { name: '暴打版', path: '/whack' },
            { name: '忍者版', path: '/ninja' },
            { name: '酷跑版', path: '/runner' },
            { name: '飞飞版', path: '/bird' },
        ];

        links.forEach(link => {
            const a = document.createElement('a');
            a.innerText = link.name;
            a.href = '#' + link.path;
            a.style.cssText = `
                text-decoration: none;
                color: #d63384;
                font-weight: bold;
                padding: 5px 15px;
                border-radius: 20px;
                background: white;
                box-shadow: 0 2px 5px rgba(214, 51, 132, 0.1);
                transition: transform 0.1s;
                font-size: 14px;
            `;
            
            // Highlight active logic could be added here, but hashchange handles updates
            
            nav.appendChild(a);
        });

        container.appendChild(nav);
    }
}
