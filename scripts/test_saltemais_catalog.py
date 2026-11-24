import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from saltemais_catalog import parse_video_id, parse_links

def test_formatos_de_url():
    assert parse_video_id('https://youtu.be/sWTAZdXH0Fk') == 'sWTAZdXH0Fk'
    assert parse_video_id('https://www.youtube.com/watch?v=lX_zTlgPmtE&ab_channel=SalteMais') == 'lX_zTlgPmtE'
    assert parse_video_id('https://youtube.com/shorts/cLVTMvDukVg?si=82AVnm') == 'cLVTMvDukVg'
    assert parse_video_id('https://youtu.be/Rtyz8IDOcqs?si=OfgPW') == 'Rtyz8IDOcqs'
    assert parse_video_id('https://youtu.be/-1w-jFFb0pk') == '-1w-jFFb0pk'

def test_parse_links_ignora_comentarios_e_deduplica():
    rows = parse_links('# x\nsalto https://youtu.be/AAAAAAAAAAA\nsalto https://youtu.be/AAAAAAAAAAA\nataque https://youtu.be/BBBBBBBBBBB\n')
    assert rows == [('salto', 'AAAAAAAAAAA'), ('ataque', 'BBBBBBBBBBB')]
