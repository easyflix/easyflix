import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

import {Folder, Library, LibraryFile} from '@app/models/file';

@Injectable()
export class FilesService {

 /* movies: Library = { type: 'library', path: '/f', name: 'Movies', numberOfVideos: 7 };*/
  /*shows: Library = { type: 'library', path: '/f/s', name: 'TV Shows', numberOfVideos: 3 };*/
  korra: Library = {"name":"Vidéos","path":"D:\\Vidéos\\Avatar - The Legend of Korra","type":"library"};

  // testUrl = 'http://127.0.0.1:8887/Captain.Fantastic.2016.1080p.BluRay.6CH.ShAaNiG.mkv?static=1';

/*  files: Video[] = [
    { path: '/f/movie2.mkv', name: 'movie2.mkv', parent: '/f', type: 'file', size: 1,
      url: 'http://127.0.0.1:8887/Assassins.Creed.2016.1080p.BluRay.x265.ShAaNiG.mkv?static=1' },
    { path: '/f/movie1.mkv', name: 'movie1.mkv', parent: '/f', type: 'file', size: 1,
      url: 'http://127.0.0.1:8887/Alice%20Au%20Pays%20Des%20Merveilles%20-%20Multi%20-%201080p%20mHDgz.mkv?static=1' },
    { path: '/f/subfolder', name: 'subfolder', parent: '/f', type: 'folder', numberOfVideos: 2 },
    { path: '/f/subfolder/sub-movie1.mkv', name: 'sub-movie1.mkv', parent: '/f/subfolder', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/subfolder/sub-movie2.mkv', name: 'sub-movie2.mkv', parent: '/f/subfolder', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/s/sub', name: 'sub', parent: '/f/s', type: 'folder', numberOfVideos: 1 },
    { path: '/f/s/sub/test.mkv', name: 'test.mkv', parent: '/f/s/sub', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/s/show1.mkv', name: 'show1.mkv', parent: '/f/s', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/s/show2.mkv', name: 'show2.mkv', parent: '/f/s', type: 'file', size: 1, url: this.testUrl },
    { path: '/f/s', name: 's', parent: '/f', type: 'folder', numberOfVideos: 3 },
  ];*/

  files: LibraryFile[] = [
    {"name":"Featurettes4","parent":"Vidéos","type":"folder"},
    {"format":"mkv","id":"Ng72Y4nY0","name":"2014 Comic-Con Panel.mkv","parent":"Vidéos/Featurettes4","size":1277602576,"type":"video"},
    {"format":"mkv","id":"NmWarF3tFS","name":"Kuvira vs. Prince Wu.mkv","parent":"Vidéos/Featurettes4","size":21113280,"type":"video"},
    {"format":"mkv","id":"qpJa2F3wES","name":"Menu Art (1).mkv","parent":"Vidéos/Featurettes4","size":84119674,"type":"video"},
    {"format":"mkv","id":"NglyuY3tA0","name":"Menu Art (2).mkv","parent":"Vidéos/Featurettes4","size":84012480,"type":"video"},
    {"format":"mkv","id":"qgo72E3oA0","name":"Republic City Hustle - Part 1.mkv","parent":"Vidéos/Featurettes4","size":47209704,"type":"video"},
    {"format":"mkv","id":"NjS7JAUwES","name":"Republic City Hustle - Part 2.mkv","parent":"Vidéos/Featurettes4","size":60873566,"type":"video"},
    {"format":"mkv","id":"GjNvrA3nF0","name":"Republic City Hustle - Part 3.mkv","parent":"Vidéos/Featurettes4","size":52245275,"type":"video"},
    {"format":"mkv","id":"Nm77rF6oE_","name":"The Making of a Legend - The Untold Story Part 2.mkv","parent":"Vidéos/Featurettes4","size":173440602,"type":"video"},
    {"name":"Season 1","parent":"Vidéos","type":"folder"},
    {"name":"Featurettes1","parent":"Vidéos/Season 1","type":"folder"},
    {"format":"mkv","id":"qm9aJY6tAH","name":"Creator's Favorite Animatics Scene - And the Winner Is.mkv","parent":"Vidéos/Season 1/Featurettes1","size":120713522,"type":"video"},
    {"format":"mkv","id":"qm4yrY3wEH","name":"Creator's Favorite Animatics Scene - Endgame.mkv","parent":"Vidéos/Season 1/Featurettes1","size":168890250,"type":"video"},
    {"format":"mkv","id":"NmEvuE6oEH","name":"Creator's Favorite Animatics Scene - The Revelation.mkv","parent":"Vidéos/Season 1/Featurettes1","size":282671065,"type":"video"},
    {"format":"mkv","id":"qjeauF3wEH","name":"Creator's Favorite Animatics Scene - The Spirit of Competition.mkv","parent":"Vidéos/Season 1/Featurettes1","size":99718374,"type":"video"},
    {"format":"mkv","id":"qgIyuY6tAH","name":"Creator's Favorite Animatics Scene - The Voice in the Night.mkv","parent":"Vidéos/Season 1/Featurettes1","size":45232838,"type":"video"},
    {"format":"mkv","id":"qjLvrY3tAS","name":"Creator's Favorite Animatics Scene - Turning the Tides.mkv","parent":"Vidéos/Season 1/Featurettes1","size":108052577,"type":"video"},
    {"format":"mkv","id":"MmxyJE3nY0","name":"Creator's Favorite Animatics Scene - Welcome to Republic City.mkv","parent":"Vidéos/Season 1/Featurettes1","size":130684837,"type":"video"},
    {"format":"mkv","id":"GjbarAUnAS","name":"Creator's Favorite Animatics Scene - When Extremes Meet.mkv","parent":"Vidéos/Season 1/Featurettes1","size":92508964,"type":"video"},
    {"format":"mkv","id":"qjjkauE4wFS","name":"Menu Art.mkv","parent":"Vidéos/Season 1/Featurettes1","size":42218914,"type":"video"},
    {"format":"mkv","id":"GjkkvuF6nEH","name":"The Making of a Legend - The Untold Story.mkv","parent":"Vidéos/Season 1/Featurettes1","size":196966553,"type":"video"},
    {"format":"mkv","id":"qjJcyJYUoA0","name":"The Legend of Korra (2012) - S01E01 - Welcome to Republic City (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":443553220,"type":"video"},
    {"format":"mkv","id":"qplkvrEUnY_","name":"The Legend of Korra (2012) - S01E02 - A Leaf in the Wind (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":437053841,"type":"video"},
    {"format":"mkv","id":"qpwfyuE6nY_","name":"The Legend of Korra (2012) - S01E03 - The Revelation (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":340906246,"type":"video"},
    {"format":"mkv","id":"Gm_cv2A4wYS","name":"The Legend of Korra (2012) - S01E04 - The Voice in the Night (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":316225147,"type":"video"},
    {"format":"mkv","id":"Nmqk72EUtE0","name":"The Legend of Korra (2012) - S01E05 - The Spirit of Competition (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":414324231,"type":"video"},
    {"format":"mkv","id":"Ggvc72Y3tEH","name":"The Legend of Korra (2012) - S01E06 - And the Winner Is... (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":389228307,"type":"video"},
    {"format":"mkv","id":"NgQcyJY4tY0","name":"The Legend of Korra (2012) - S01E07 - The Aftermath (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":361701009,"type":"video"},
    {"format":"mkv","id":"qj3cv2A6nYH","name":"The Legend of Korra (2012) - S01E08 - When Extremes Meet (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":349241334,"type":"video"},
    {"format":"mkv","id":"NgAfy2Y4wY0","name":"The Legend of Korra (2012) - S01E09 - Out of the Past (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":340182442,"type":"video"},
    {"format":"mkv","id":"MgZf7uAUwFS","name":"The Legend of Korra (2012) - S01E10 - Turning the Tides (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":366868970,"type":"video"},
    {"format":"mkv","id":"qpCWaJE6tES","name":"The Legend of Korra (2012) - S01E11 - Skeletons in the Closet (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":363340547,"type":"video"},
    {"format":"mkv","id":"qjTkvuF6wF0","name":"The Legend of Korra (2012) - S01E12 - Endgame (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 1","size":366455465,"type":"video"},
    {"name":"Season 2","parent":"Vidéos","type":"folder"},
    {"name":"Featurettes2","parent":"Vidéos/Season 2","type":"folder"},
    {"format":"mkv","id":"qj-fv2E4wAH","name":"Feuding Spirts Korra’s Family.mkv","parent":"Vidéos/Season 2/Featurettes2","size":140308915,"type":"video"},
    {"format":"mkv","id":"qgKWarA4oAH","name":"Inside the Book of Spirts.mkv","parent":"Vidéos/Season 2/Featurettes2","size":288325401,"type":"video"},
    {"format":"mkv","id":"qmm2vrF6tYS","name":"Kindred Spirts Tenzin’s Family.mkv","parent":"Vidéos/Season 2/Featurettes2","size":121802231,"type":"video"},
    {"format":"mkv","id":"NjkryJF6nFS","name":"Menu Art Disk 1.mkv","parent":"Vidéos/Season 2/Featurettes2","size":146268488,"type":"video"},
    {"format":"mkv","id":"MjruvrE4wF0","name":"Menu Art Disk 2.mkv","parent":"Vidéos/Season 2/Featurettes2","size":146067368,"type":"video"},
    {"name":"Scene Bending","parent":"Vidéos/Season 2/Featurettes2","type":"folder"},
    {"format":"mkv","id":"Mm5rvrFUnF_","name":"A New Spiritual Age.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":89880972,"type":"video"},
    {"format":"mkv","id":"Nmtuv2F6wES","name":"Beginnings, Part 1.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":94276884,"type":"video"},
    {"format":"mkv","id":"GjH27JE3oES","name":"Beginnings, Part 2.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":131816878,"type":"video"},
    {"format":"mkv","id":"GmGJvrY3tAH","name":"Civil Wars, Part 1.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":57248527,"type":"video"},
    {"format":"mkv","id":"GjarauA4wEH","name":"Civil Wars, Part 2.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":71570656,"type":"video"},
    {"format":"mkv","id":"qp9uarA3wA0","name":"Darkness Falls.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":74655502,"type":"video"},
    {"format":"mkv","id":"Nm3uyrA3tES","name":"Harmonic Convergence.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":81079497,"type":"video"},
    {"format":"mkv","id":"qpYJ7uF3tAH","name":"Light in the Dark.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":67535208,"type":"video"},
    {"format":"mkv","id":"qghJ7uY4wY_","name":"Night of a Thousand Stars.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":88044485,"type":"video"},
    {"format":"mkv","id":"qgIrauE4tA_","name":"Peacekeepers Scene 1.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":82777303,"type":"video"},
    {"format":"mkv","id":"qpTuyuY4nYH","name":"Rebel Spirt Scene 1.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":125796301,"type":"video"},
    {"format":"mkv","id":"Gjx272AUnF0","name":"Rebel Spirt Scene 2.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":71252788,"type":"video"},
    {"format":"mkv","id":"Nmb2auA6oF_","name":"The Guide.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":53492514,"type":"video"},
    {"format":"mkv","id":"qmjdauY3wF_","name":"The Southern Lights Scene 1.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":57167956,"type":"video"},
    {"format":"mkv","id":"GpW5yuA3wYH","name":"The Southern Lights Scene 2.mkv","parent":"Vidéos/Season 2/Featurettes2/Scene Bending","size":104052824,"type":"video"},
    {"format":"mkv","id":"Np2OvJY3tAS","name":"The Re-telling of Korra’s Journey.mkv","parent":"Vidéos/Season 2/Featurettes2","size":623091332,"type":"video"},
    {"format":"mkv","id":"Nmldv2FUoAH","name":"The Legend of Korra (2012) - S02E01 - Rebel Spirit (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":390090380,"type":"video"},
    {"format":"mkv","id":"MgwO7rF4wA_","name":"The Legend of Korra (2012) - S02E02 - The Southern Lights (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":433138560,"type":"video"},
    {"format":"mkv","id":"Mg0larEUoFS","name":"The Legend of Korra (2012) - S02E03 - Civil Wars (1) (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":292902014,"type":"video"},
    {"format":"mkv","id":"GmGdauE3nA0","name":"The Legend of Korra (2012) - S02E04 - Civil Wars (2) (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":282270455,"type":"video"},
    {"format":"mkv","id":"Mj75a2YUwYH","name":"The Legend of Korra (2012) - S02E05 - Peacekeepers (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":328522763,"type":"video"},
    {"format":"mkv","id":"MmROarA3wE0","name":"The Legend of Korra (2012) - S02E06 - The Sting (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":306591260,"type":"video"},
    {"format":"mkv","id":"Gg3daJY4nF0","name":"The Legend of Korra (2012) - S02E07 - The Beginnings Part 1 (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":513655764,"type":"video"},
    {"format":"mkv","id":"GpFly2FUtA_","name":"The Legend of Korra (2012) - S02E08 - The Beginnings Part 2 (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":602244827,"type":"video"},
    {"format":"mkv","id":"GpZO7rF4oYS","name":"The Legend of Korra (2012) - S02E09 - The Guide (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":337793638,"type":"video"},
    {"format":"mkv","id":"NgI5auF3nA0","name":"The Legend of Korra (2012) - S02E10 - A New Spiritual Age (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":358698896,"type":"video"},
    {"format":"mkv","id":"qgTdvJEUnA_","name":"The Legend of Korra (2012) - S02E11 - Night of a Thousand Stars (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":349536042,"type":"video"},
    {"format":"mkv","id":"qpD57rAUwY0","name":"The Legend of Korra (2012) - S02E12 - Harmonic Convergence (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":429040008,"type":"video"},
    {"format":"mkv","id":"Nm857rF6oFS","name":"The Legend of Korra (2012) - S02E13 - Darkness Falls (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":406500361,"type":"video"},
    {"format":"mkv","id":"NmmtarY4wES","name":"The Legend of Korra (2012) - S02E14 - Light in the Dark (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 2","size":400600092,"type":"video"},
    {"name":"Season 3","parent":"Vidéos","type":"folder"},
    {"name":"Featurettes3","parent":"Vidéos/Season 3","type":"folder"},
    {"format":"mkv","id":"NmftyuF4nE0","name":"Menu Art Disk 1.mkv","parent":"Vidéos/Season 3/Featurettes3","size":71620296,"type":"video"},
    {"format":"mkv","id":"Ng2nvuAUoAS","name":"Menu Art Disk 2.mkv","parent":"Vidéos/Season 3/Featurettes3","size":71375866,"type":"video"},
    {"name":"The Spirit of an Episode","parent":"Vidéos/Season 3/Featurettes3","type":"folder"},
    {"format":"mkv","id":"Mgloa2EUtE0","name":"A Breath of Fresh Air.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":76785454,"type":"video"},
    {"format":"mkv","id":"Mpwov2A3tA0","name":"Enter The Void.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":110539245,"type":"video"},
    {"format":"mkv","id":"NmSovJE6tA0","name":"In Harm’s Way.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":66747736,"type":"video"},
    {"format":"mkv","id":"NpqtyJEUtEH","name":"Long Live The Queen.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":79715939,"type":"video"},
    {"format":"mkv","id":"Mmanv2A4wF0","name":"Old Wounds.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":91361477,"type":"video"},
    {"format":"mkv","id":"MjQov2E3nFS","name":"Original Airbenders.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":71146704,"type":"video"},
    {"format":"mkv","id":"Gp3nvrA3tY0","name":"Rebirth.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":115957667,"type":"video"},
    {"format":"mkv","id":"NjAtauF4wAS","name":"The Earth Queen.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":137758276,"type":"video"},
    {"format":"mkv","id":"GpZoaJF4oE0","name":"The Metal Clan.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":98936724,"type":"video"},
    {"format":"mkv","id":"NgCnv2E4tA_","name":"The Stakeout.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":94626454,"type":"video"},
    {"format":"mkv","id":"NmVwauF6nAH","name":"The Terror Within.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":111174882,"type":"video"},
    {"format":"mkv","id":"Gm-tyrE4nA0","name":"The Ultimatum.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":99210251,"type":"video"},
    {"format":"mkv","id":"MmKt7rE4wY_","name":"Venom of the Red Lotus.mkv","parent":"Vidéos/Season 3/Featurettes3/The Spirit of an Episode","size":102019193,"type":"video"},
    {"format":"mkv","id":"MjgH7rA4wA_","name":"The Legend of Korra (2012) - S03E01 - A Breath of Fresh Air (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":491839806,"type":"video"},
    {"format":"mkv","id":"qgcSauEUtFH","name":"The Legend of Korra (2012) - S03E02 - Rebirth (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":476782283,"type":"video"},
    {"format":"mkv","id":"MjJS7rEUwE_","name":"The Legend of Korra (2012) - S03E03 - The Earth Queen (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":516662386,"type":"video"},
    {"format":"mkv","id":"Npd072EUnY_","name":"The Legend of Korra (2012) - S03E04 - In Harm's Way (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":459178050,"type":"video"},
    {"format":"mkv","id":"Njt07JEUtAH","name":"The Legend of Korra (2012) - S03E05 - The Metal Clan (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":447115220,"type":"video"},
    {"format":"mkv","id":"Gp_Hv2E3tF_","name":"The Legend of Korra (2012) - S03E06 - Old Wounds (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":462429283,"type":"video"},
    {"format":"mkv","id":"qpN0vrF4tE_","name":"The Legend of Korra (2012) - S03E07 - Original Airbenders (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":415939019,"type":"video"},
    {"format":"mkv","id":"qjv0vJA3nY_","name":"The Legend of Korra (2012) - S03E08 - The Terror Within (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":417725247,"type":"video"},
    {"format":"mkv","id":"qm9SarY4nAS","name":"The Legend of Korra (2012) - S03E09 - The Stakeout (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":378825555,"type":"video"},
    {"format":"mkv","id":"qgU0aJY3wA_","name":"The Legend of Korra (2012) - S03E10 - Long Live the Queen (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":357157308,"type":"video"},
    {"format":"mkv","id":"MmEHarY6oE_","name":"The Legend of Korra (2012) - S03E11 - The Ultimatum (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":444890281,"type":"video"},
    {"format":"mkv","id":"qjeSvJA4nEH","name":"The Legend of Korra (2012) - S03E12 - Enter the Void (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":400871765,"type":"video"},
    {"format":"mkv","id":"qgI072F4wFS","name":"The Legend of Korra (2012) - S03E13 - Venom of the Red Lotus (1080p BluRay x265 RCVR).mkv","parent":"Vidéos/Season 3","size":472522417,"type":"video"},
    {"format":"mkv","id":"GgVSvuY4oA_","name":"The Legend of Korra (2012) - S04E01 - After All These Years (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":386318876,"type":"video"},
    {"format":"mkv","id":"NjDH7JF4wA0","name":"The Legend of Korra (2012) - S04E02 - Korra Alone (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":307960469,"type":"video"},
    {"format":"mkv","id":"Gpz0aJYUnA0","name":"The Legend of Korra (2012) - S04E03 - The Coronation (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":269248762,"type":"video"},
    {"format":"mkv","id":"MppMvuFUwFS","name":"The Legend of Korra (2012) - S04E04 - The Calling (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":304204666,"type":"video"},
    {"format":"mkv","id":"MgWNa2Y6oYH","name":"The Legend of Korra (2012) - S04E05 - Enemy at the Gates (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":333298423,"type":"video"},
    {"format":"mkv","id":"Ng2MvJF3wEH","name":"The Legend of Korra (2012) - S04E06 - The Battle of Zaofu (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":329468968,"type":"video"},
    {"format":"mkv","id":"qp5NyuY4wF0","name":"The Legend of Korra (2012) - S04E07 - Reunion (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":386196680,"type":"video"},
    {"format":"mkv","id":"GjtM7JY3tA0","name":"The Legend of Korra (2012) - S04E08 - Remembrances (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":305278789,"type":"video"},
    {"format":"mkv","id":"Nj0NyrF6wY0","name":"The Legend of Korra (2012) - S04E09 - Beyond the Wilds (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":304197404,"type":"video"},
    {"format":"mkv","id":"GpNM7JEUoFH","name":"The Legend of Korra (2012) - S04E10 - Operation Beifong (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":344875932,"type":"video"},
    {"format":"mkv","id":"Np7Ga2Y4tA0","name":"The Legend of Korra (2012) - S04E11 - Kuvira's Gambit (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":296293738,"type":"video"},
    {"format":"mkv","id":"Ng1q7JA6wY_","name":"The Legend of Korra (2012) - S04E12 - Day of the Colossus (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":467074851,"type":"video"},
    {"format":"mkv","id":"Gj3GaJF4oE_","name":"The Legend of Korra (2012) - S04E13 - The Last Stand (1080p BluRay x265 RCVR).mkv","parent":"Vidéos","size":479279910,"type":"video"},
  ];

  constructor() {}

  getFiles(folder: Folder | Library): Observable<LibraryFile[]> {
    let folderPath;
    switch (folder.type) {
      case 'library':
        folderPath = folder.name; break;
      case 'folder':
        folderPath = `${folder.parent}/${folder.name}`;
    }
    return of(this.files).pipe(
      map(files => files.filter(file => file.parent === folderPath))
    );

    /*return of(this.files).pipe(
      map(files => files.filter(file => file.parent === folder.path)),
      map(files => files.sort((a, b) => a.path.localeCompare(b.path))),
      /!*map(files => files.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') {
          return -1;
        }
        if (a.type !== 'directory' && b.type === 'directory') {
          return 1;
        }
        return 0;
      }))*!/
    );*/
  }

  getLibraries(): Observable<Library[]> {
    return of([
      this.korra
    ]);
  }

}
