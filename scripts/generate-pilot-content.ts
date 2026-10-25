/**
 * ShikshaSahayak — Phase 3 Real Content Pilot
 * Subject: GTU Computer Engineering Sem 5 — Computer Networks (3150710)
 * Unit 1: Introduction to Computer Networks & Physical Layer Architecture
 * 
 * 4 High-Quality Selected Pilot Topics:
 * 1. OSI Reference Model & 7-Layer Architecture
 * 2. TCP/IP Protocol Suite vs OSI Reference Model
 * 3. Network Topologies (Bus, Star, Ring, Mesh, Hybrid)
 * 4. Transmission Media (Guided vs Unguided Media)
 */

import { formatPayloadToMarkdown, ContentGenerationParams, GeneratedContentPayload } from '../functions/lib/content-factory/provider';
import { validateGeneratedContent } from '../functions/lib/content-factory/validator';
import * as fs from 'fs';
import * as path from 'path';

export const PILOT_TOPICS: { params: ContentGenerationParams; payload: GeneratedContentPayload }[] = [
  // --------------------------------------------------------------------------
  // TOPIC 1: OSI Reference Model & 7-Layer Architecture
  // --------------------------------------------------------------------------
  {
    params: {
      university: 'gtu',
      branch: 'branch_computer',
      semester: 5,
      subject: 'Computer Networks',
      unitNo: 1,
      unitTitle: 'Introduction to Computer Networks & Physical Layer',
      topic: 'OSI Reference Model & 7-Layer Architecture',
      contentTypes: [
        'detailed_notes', 'short_notes', 'definitions', 'examples', 'mcqs',
        'short_questions', 'long_questions', 'numerical_problems', 'viva_questions', 'quick_revision'
      ]
    },
    payload: {
      topic: 'OSI Reference Model & 7-Layer Architecture',
      detailedNotes: `### 1. Introduction to the OSI Model
The **Open Systems Interconnection (OSI)** reference model is a conceptual framework established by the **International Organization for Standardization (ISO)** in 1984 (ISO/IEC 7498-1). It standardizes communication functions across heterogeneous networking systems by dividing network communication into seven independent, hierarchical abstraction layers.

Each layer performs a dedicated set of network functions and communicates strictly with its adjacent layers through standardized interfaces using **Service Access Points (SAPs)**.

---

### 2. The 7-Layer Architecture Breakdown

\`\`\`
+-------------------------------------------------------+
|  7. Application Layer   (Network services to apps)    |  <-- Upper Layers
|  6. Presentation Layer  (Data formatting & encryption)|      (Software / Host)
|  5. Session Layer       (Dialog & connection control) |
+-------------------------------------------------------+
|  4. Transport Layer     (End-to-end reliability, TCP) |  <-- Heart of OSI
+-------------------------------------------------------+
|  3. Network Layer       (Logical routing & IP)        |  <-- Lower Layers
|  2. Data Link Layer     (Framing, MAC, error control) |      (Hardware / Network)
|  1. Physical Layer      (Bit transmission & signals)  |
+-------------------------------------------------------+
\`\`\`

#### Layer 1: Physical Layer
- **Core Function**: Transmits raw, unstructured bit streams over physical transmission media (copper wire, fiber optic, or wireless radio).
- **Key Responsibilities**:
  - **Bit Synchronization**: Regulates bit duration and clock synchronization between transmitter and receiver.
  - **Transmission Rate**: Defines data rate (bits per second).
  - **Physical Topologies & Line Configuration**: Point-to-point or multipoint connections (Bus, Star, Ring, Mesh).
  - **Transmission Mode**: Simplex, Half-Duplex, or Full-Duplex.
- **Protocols & Hardware**: RS-232, RJ-45, Ethernet 100BASE-TX, Repeaters, Hubs.

#### Layer 2: Data Link Layer (DLL)
- **Core Function**: Transforms a raw physical transmission facility into a reliable, error-free link for the upper network layer.
- **Sublayers**:
  1. **Logical Link Control (LLC)**: Flow control and error handling.
  2. **Media Access Control (MAC)**: Hardware addressing and medium arbitration.
- **Key Responsibilities**:
  - **Framing**: Packages network-layer packets into discrete data frames with header and trailer.
  - **Physical Addressing**: 48-bit MAC address (e.g., \`00:1A:2B:3C:4D:5E\`).
  - **Error Control**: Error detection and correction using Cyclic Redundancy Check (CRC/FCS).
  - **Flow Control**: Prevents buffer overflow at receiver (Stop-and-Wait, Sliding Window).
- **Protocols & Hardware**: IEEE 802.3 (Ethernet), IEEE 802.11 (Wi-Fi), PPP, Switches, Bridges.

#### Layer 3: Network Layer
- **Core Function**: Manages source-to-destination (host-to-host) packet delivery across multiple heterogeneous network hops.
- **Key Responsibilities**:
  - **Logical Addressing**: 32-bit IPv4 or 128-bit IPv6 addressing.
  - **Routing & Path Determination**: Determines the optimal route using routing algorithms (OSPF, RIP, BGP).
  - **Packet Fragmentation & Reassembly**: Splits oversized packets to match the Maximum Transmission Unit (MTU) of the physical link.
- **Protocols & Hardware**: IPv4, IPv6, ICMP, ARP, Routers, Layer 3 Switches.

#### Layer 4: Transport Layer
- **Core Function**: Ensures end-to-end, process-to-process delivery of the complete message.
- **Key Responsibilities**:
  - **Port Addressing / Service-Point Addressing**: 16-bit Port numbers (e.g., HTTP: 80, HTTPS: 443, DNS: 53) to deliver data to the correct application process.
  - **Segmentation & Reassembly**: Splits application messages into smaller segments with sequence numbers.
  - **Connection Management**: Connection-oriented (TCP with 3-way handshake) or connectionless (UDP).
  - **End-to-End Flow & Congestion Control**: Sliding window buffer management.
- **Protocols**: TCP, UDP, SCTP.

#### Layer 5: Session Layer
- **Core Function**: Establishes, manages, synchronizes, and terminates communication sessions between applications.
- **Key Responsibilities**:
  - **Dialog Control**: Regulates whether communication is half-duplex or full-duplex.
  - **Synchronization & Checkpointing**: Inserts checkpoints into long data streams; if a failure occurs, retransmission resumes from the last checkpoint rather than starting over.
- **Protocols**: NetBIOS, RPC, PPTP.

#### Layer 6: Presentation Layer
- **Core Function**: Translates, encrypts, and compresses data, ensuring compatibility between different data representation formats.
- **Key Responsibilities**:
  - **Translation / Encoding**: Converts between ASCII, EBCDIC, and Unicode formats.
  - **Encryption & Decryption**: Cryptographic protection (e.g., TLS/SSL).
  - **Data Compression**: Reduces bit count to optimize transmission efficiency (e.g., JPEG, MPEG, GZIP).
- **Protocols**: TLS/SSL, MIME, XDR.

#### Layer 7: Application Layer
- **Core Function**: Provides the interface for end-user software applications to access network services.
- **Key Services**: File transfer, electronic mail, remote login, web browsing, distributed databases.
- **Protocols**: HTTP, HTTPS, FTP, SMTP, DNS, SSH, DHCP.

---

### 3. Encapsulation & Protocol Data Units (PDUs)
As data travels down the OSI stack on the sender side, each layer prepends a header containing control metadata. At Layer 2, a trailer is also appended:

$$\\text{Application Data} \\rightarrow \\text{Segment (L4)} \\rightarrow \\text{Packet (L3)} \\rightarrow \\text{Frame (L2)} \\rightarrow \\text{Bits (L1)}$$`,

      shortNotes: `• **OSI Model**: 7-Layer ISO standard developed in 1984 for open network communication.
• **Mnemonic**: *All People Seem To Need Data Processing* (L7 to L1) or *Please Do Not Throw Sausage Pizza Away* (L1 to L7).
• **Layer Divisions**:
  - Upper Layers (L5–L7): Software / Application centric.
  - Heart of OSI (L4): Transport Layer (Process-to-Process delivery).
  - Lower Layers (L1–L3): Hardware / Network centric (Data delivery over physical media).
• **PDU Mapping**:
  - L7, L6, L5: **Data / Message**
  - L4 (Transport): **Segment** (TCP) or **Datagram** (UDP)
  - L3 (Network): **Packet** (IP)
  - L2 (Data Link): **Frame** (MAC header + CRC trailer)
  - L1 (Physical): **Bits** (0s & 1s electrical/optical pulses)
• **Key Addressing**:
  - Port Address: 16-bit (L4)
  - IP Address: 32-bit IPv4 / 128-bit IPv6 (L3)
  - MAC Address: 48-bit Physical address (L2)`,

      definitions: [
        {
          term: 'OSI Reference Model',
          definition: 'A 7-layer architectural framework developed by the ISO to standardize communication protocols across heterogeneous computer network systems.',
          keyPoints: ['7 distinct layers', 'Standardized interfaces via SAPs', 'Strict abstraction of functions']
        },
        {
          term: 'Protocol Data Unit (PDU)',
          definition: 'The specific unit of data transmitted among peer entities within a specific layer of the OSI network architecture, containing layer-specific headers and payload.',
          keyPoints: ['Segment at L4', 'Packet at L3', 'Frame at L2', 'Bits at L1']
        },
        {
          term: 'Data Encapsulation',
          definition: 'The process of wrapping lower-layer control headers and trailers around higher-layer data units as information traverses down the protocol stack at the sending node.',
          keyPoints: ['Sender-side process', 'Decapsulation is receiver-side reverse process']
        }
      ],

      examples: [
        {
          title: 'Web Page Request via the 7 OSI Layers',
          scenario: 'A student enters https://shikshasahayak.org in a web browser to download GTU lecture notes.',
          explanation: '1. Application (L7) generates HTTP GET request. 2. Presentation (L6) formats and encrypts via TLS. 3. Session (L5) maintains the active session. 4. Transport (L4) assigns TCP port 443, segments data, and sets SYN flag. 5. Network (L3) attaches source/destination IP addresses. 6. Data Link (L2) encapsulates IP packet into an Ethernet frame with destination MAC address and appends CRC. 7. Physical (L1) transmits frame as optical or electrical signals across the cable.'
        }
      ],

      mcqs: [
        {
          question: 'Which layer of the OSI reference model is responsible for process-to-process delivery and port addressing?',
          options: ['Network Layer', 'Transport Layer', 'Data Link Layer', 'Session Layer'],
          answer: 1,
          explanation: 'The Transport Layer (Layer 4) provides process-to-process delivery using 16-bit port numbers, distinguishing between multiple active applications running on the same host.'
        },
        {
          question: 'At which OSI layer does Cyclic Redundancy Check (CRC) error detection trailer typically get appended?',
          options: ['Physical Layer', 'Data Link Layer', 'Network Layer', 'Presentation Layer'],
          answer: 1,
          explanation: 'The Data Link Layer (Layer 2) appends a Frame Check Sequence (FCS/CRC) trailer to detect frame transmission errors.'
        },
        {
          question: 'Which layer is responsible for data encryption, decryption, and data compression in the OSI model?',
          options: ['Application Layer', 'Presentation Layer', 'Session Layer', 'Transport Layer'],
          answer: 1,
          explanation: 'The Presentation Layer (Layer 6) handles data representation, character translation (e.g. ASCII to EBCDIC), compression, and cryptographic security (TLS/SSL encryption).'
        },
        {
          question: 'What is the correct PDU sequence as data moves from Layer 4 down to Layer 1?',
          options: [
            'Packet -> Segment -> Frame -> Bits',
            'Segment -> Packet -> Frame -> Bits',
            'Frame -> Packet -> Segment -> Bits',
            'Message -> Frame -> Packet -> Bits'
          ],
          answer: 1,
          explanation: 'As data moves down the stack, it transitions from Segment (Layer 4) -> Packet (Layer 3) -> Frame (Layer 2) -> Bits (Layer 1).'
        },
        {
          question: 'Which device operates primarily at Layer 3 (Network Layer) of the OSI reference model?',
          options: ['Repeater', 'Bridge', 'Router', 'Passive Hub'],
          answer: 2,
          explanation: 'A Router is a Layer 3 device that inspects logical IP addresses to forward packets across different network subnets.'
        }
      ],

      shortQuestions: [
        {
          question: 'Differentiate between Flow Control and Error Control in the Data Link Layer.',
          answer: 'Flow Control regulates the rate of data transmission between a fast sender and a slow receiver to prevent buffer overflow (using techniques like Stop-and-Wait or Sliding Window). Error Control detects and corrects bit errors introduced during transmission (using mechanisms like CRC and ARQ retransmissions).',
          marks: 3
        },
        {
          question: 'Why is the Transport Layer referred to as the "Heart of the OSI Model"?',
          answer: 'The Transport Layer (Layer 4) acts as the bridge between the upper software-oriented layers (Application, Presentation, Session) and lower hardware-oriented communication layers (Network, Data Link, Physical). It provides end-to-end reliability, segmentation, and process-to-process isolation.',
          marks: 3
        },
        {
          question: 'What is the primary role of the Session Layer in distributed computing?',
          answer: 'The Session Layer establishes, manages, and terminates dialogs between cooperating applications. It introduces synchronization checkpoints so that in the event of connection loss, data transfer resumes from the last confirmed checkpoint rather than from the beginning.',
          marks: 3
        }
      ],

      longQuestions: [
        {
          question: 'Explain the 7 layers of the OSI Reference Model in detail with neat diagrams, layer-by-layer functions, and protocol data units (PDUs).',
          answer: `The OSI Reference Model defines a 7-layer architecture for open network communication:
1. **Physical Layer (L1)**: Bit transmission, physical topology, clock synchronization. PDU: Bits.
2. **Data Link Layer (L2)**: Framing, MAC addressing (48-bit), flow control, CRC error checking. PDU: Frame.
3. **Network Layer (L3)**: Logical IP addressing (IPv4/IPv6), routing (OSPF, RIP), packet fragmentation. PDU: Packet.
4. **Transport Layer (L4)**: Port addressing (16-bit), segmentation, TCP 3-way handshake, reliable delivery. PDU: Segment.
5. **Session Layer (L5)**: Session establishment, dialog synchronization with checkpoints, termination. PDU: Data.
6. **Presentation Layer (L6)**: Data formatting, translation (ASCII/Unicode), compression, TLS/SSL encryption. PDU: Data.
7. **Application Layer (L7)**: User-facing network services (HTTP, FTP, SMTP, DNS). PDU: Message/Data.

**Encapsulation Flow**: Application Data is wrapped into L4 Segment -> L3 Packet -> L2 Frame (Header + Trailer) -> L1 Physical Bits.`,
          keyPoints: [
            'Labeled 7-layer diagram from Physical to Application',
            'Detailed functional explanation for all 7 layers',
            'Listing of PDU types at each layer',
            'Real-world protocol mapping per layer',
            'Clear distinction between upper and lower layers'
          ],
          marks: 7
        },
        {
          question: 'Describe the process of Data Encapsulation and Decapsulation across the OSI model with a step-by-step example.',
          answer: `**Encapsulation (Sender Side)**:
1. Application layer produces the raw user data (e.g. HTTP payload).
2. Presentation layer adds formatting/encryption tags ($H_6$).
3. Session layer adds session coordination headers ($H_5$).
4. Transport layer adds port headers ($H_4$) forming a **Segment**.
5. Network layer adds source/destination IP headers ($H_3$) forming a **Packet**.
6. Data Link layer prepends MAC header ($H_2$) and appends CRC trailer ($T_2$) forming a **Frame**.
7. Physical layer converts frame into electrical/optical pulses (**Bits**).

**Decapsulation (Receiver Side)**:
The receiving station performs the exact reverse operation, stripping headers layer by layer ($L_1 \\rightarrow L_2 \\rightarrow L_3 \\rightarrow L_4 \\rightarrow L_5 \\rightarrow L_6 \\rightarrow L_7$) after verifying checksums.`,
          keyPoints: [
            'Step-by-step encapsulation at sender node',
            'Header addition ($H_7$ through $H_2$) and Trailer ($T_2$)',
            'Step-by-step decapsulation at receiver node',
            'Checksum verification at Data Link and Transport layers'
          ],
          marks: 7
        }
      ],

      numericalProblems: [
        {
          problem: 'A sender transmits a 12,000-bit data packet over a 10 Mbps point-to-point link. The distance between the sender and receiver is 2,000 km, and signal propagation speed through the transmission medium is $2 \\times 10^8\\text{ m/s}$. Calculate: (a) Transmission Delay ($T_{tx}$), (b) Propagation Delay ($T_{prop}$), and (c) Total Latency ($T_{total}$).',
          givenData: `• Packet Size ($L$) = 12,000 bits
• Bandwidth ($B$) = $10\\text{ Mbps} = 10 \\times 10^6\\text{ bits/second}$
• Distance ($d$) = $2,000\\text{ km} = 2 \\times 10^6\\text{ meters}$
• Propagation Speed ($v$) = $2 \\times 10^8\\text{ m/s}$`,
          formulaUsed: `1. Transmission Delay: $T_{tx} = \\frac{L}{B}$
2. Propagation Delay: $T_{prop} = \\frac{d}{v}$
3. Total Latency: $T_{total} = T_{tx} + T_{prop}$`,
          steps: [
            'Step 1: Calculate Transmission Delay:\n$$T_{tx} = \\frac{12,000\\text{ bits}}{10 \\times 10^6\\text{ bps}} = 0.0012\\text{ seconds} = 1.2\\text{ ms}$$',
            'Step 2: Calculate Propagation Delay:\n$$T_{prop} = \\frac{2 \\times 10^6\\text{ m}}{2 \\times 10^8\\text{ m/s}} = 0.01\\text{ seconds} = 10.0\\text{ ms}$$',
            'Step 3: Calculate Total Latency:\n$$T_{total} = T_{tx} + T_{prop} = 1.2\\text{ ms} + 10.0\\text{ ms} = 11.2\\text{ ms}$$'
          ],
          finalAnswer: 'Transmission Delay = 1.2 ms, Propagation Delay = 10.0 ms, Total Latency = 11.2 ms'
        }
      ],

      vivaQuestions: [
        {
          question: 'Why does only the Data Link Layer have both a header and a trailer in the OSI model?',
          answer: 'The trailer contains the Frame Check Sequence (FCS/CRC) calculated over the entire frame. The transmitter calculates this value on the fly as bits pass through the hardware, so it is naturally appended at the end of the frame.'
        },
        {
          question: 'Can two different applications running on the same computer share the same port number simultaneously?',
          answer: 'No. Port numbers must be uniquely bound to an active process per transport protocol (TCP/UDP) on a given IP address so the OS can demultiplex incoming segments to the correct socket.'
        },
        {
          question: 'What is the main difference between bit rate and baud rate at the Physical layer?',
          answer: 'Bit rate is the number of bits transmitted per second (bps), whereas baud rate is the number of signal units (symbol changes) per second. If 1 signal unit carries 2 bits (e.g. QPSK), then Bit Rate = 2 * Baud Rate.'
        }
      ],

      quickRevision: {
        summaryPoints: [
          'OSI is a 7-layer theoretical reference framework; TCP/IP is a 4-layer practical implementation.',
          'Lower layers (L1–L3) handle network routing & transmission; Upper layers (L5–L7) handle application support; L4 (Transport) bridges them.',
          'MAC address is 48-bit (Layer 2); IP address is 32-bit/128-bit (Layer 3); Port number is 16-bit (Layer 4).'
        ],
        formulas: [
          'Transmission Delay = Packet Size (bits) / Bandwidth (bps)',
          'Propagation Delay = Distance (m) / Speed (m/s)',
          'Total Latency = Transmission Delay + Propagation Delay + Queuing Delay + Processing Delay'
        ],
        commonMistakes: [
          'Confusing hop-by-hop flow control (Data Link Layer) with end-to-end flow control (Transport Layer).',
          'Thinking routers inspect MAC addresses rather than IP addresses.',
          'Assuming OSI is the actual protocol used on the modern Internet rather than TCP/IP.'
        ]
      }
    }
  },

  // --------------------------------------------------------------------------
  // TOPIC 2: TCP/IP Protocol Suite vs OSI Reference Model
  // --------------------------------------------------------------------------
  {
    params: {
      university: 'gtu',
      branch: 'branch_computer',
      semester: 5,
      subject: 'Computer Networks',
      unitNo: 1,
      unitTitle: 'Introduction to Computer Networks & Physical Layer',
      topic: 'TCP/IP Protocol Suite vs OSI Reference Model',
      contentTypes: [
        'detailed_notes', 'short_notes', 'definitions', 'examples', 'mcqs',
        'short_questions', 'long_questions', 'viva_questions', 'quick_revision'
      ]
    },
    payload: {
      topic: 'TCP/IP Protocol Suite vs OSI Reference Model',
      detailedNotes: `### 1. Introduction to the TCP/IP Protocol Suite
The **TCP/IP Protocol Suite** (Transmission Control Protocol / Internet Protocol), also known as the **DoD Model** (Department of Defense), is the practical, commercial architectural framework upon which the global Internet is built. It was developed by **Vinton Cerf** and **Robert Kahn** in the 1970s.

Unlike the theoretical 7-layer OSI reference model, TCP/IP uses a streamlined 4-layer (or 5-layer in modern textbooks) architecture optimized for resilience, loose coupling, and interoperability.

---

### 2. Architecture Comparison: TCP/IP vs OSI

\`\`\`
       OSI 7-Layer Model                    TCP/IP 4-Layer Model
+-------------------------------+       +-------------------------------+
|  7. Application Layer         |       |                               |
|  6. Presentation Layer        |  -->  |  4. Application Layer         |
|  5. Session Layer             |       |     (HTTP, DNS, SMTP, FTP)    |
+-------------------------------+       +-------------------------------+
|  4. Transport Layer           |  -->  |  3. Transport / Host-to-Host  |
|                               |       |     (TCP, UDP)                |
+-------------------------------+       +-------------------------------+
|  3. Network Layer             |  -->  |  2. Internet Layer            |
|                               |       |     (IPv4, IPv6, ICMP, ARP)   |
+-------------------------------+       +-------------------------------+
|  2. Data Link Layer           |  -->  |  1. Network Access / Link     |
|  1. Physical Layer            |       |     (Ethernet, Wi-Fi, PPP)    |
+-------------------------------+       +-------------------------------+
\`\`\`

---

### 3. Detailed Comparison Matrix

| Feature / Dimension | OSI Reference Model | TCP/IP Protocol Suite |
| :--- | :--- | :--- |
| **Development Approach** | Protocol-independent; model was designed **before** protocols were written. | Protocol-driven; protocols were created **first**, and the model described them. |
| **Number of Layers** | **7 Layers** | **4 Layers** (or 5 Layers in modern taxonomy) |
| **Session & Presentation** | Separate, dedicated layers (L5 and L6). | Merged directly into the **Application Layer**. |
| **Transport Layer Mode** | Supports both connection-oriented and connectionless service. | Supports connection-oriented (**TCP**) and connectionless (**UDP**). |
| **Network / Internet Mode** | Supports connection-oriented and connectionless service. | **Connectionless only** at IP level (Best-effort delivery). |
| **Usage / Status** | Theoretical standard for teaching and conceptual design. | Actual working standard of the global commercial Internet. |
| **Protocol Coupling** | Strict layer independence (loose coupling). | Tightly coupled with standard Internet protocols. |
| **Reliability Placement** | Assumes physical link may be reliable; checks at DLL and Transport. | Assumes network is inherently unreliable; reliability handled at endpoints (TCP). |`,

      shortNotes: `• **TCP/IP Architecture**: 4 Layers: Application, Transport, Internet, Network Access.
• **Layer Merges**:
  - OSI Layers 5, 6, 7 $\\rightarrow$ TCP/IP Application Layer.
  - OSI Layers 1, 2 $\\rightarrow$ TCP/IP Network Access (Link) Layer.
• **Core Protocols**:
  - Application: HTTP/HTTPS (80/443), DNS (53), SMTP (25), SSH (22), DHCP (67/68).
  - Transport: TCP (reliable stream, 3-way handshake), UDP (unreliable datagram, low latency).
  - Internet: IP (packet routing), ICMP (diagnostic ping), ARP (IP to MAC mapping).
  - Network Access: Ethernet (802.3), Wi-Fi (802.11).
• **Design Philosophy**: End-to-end principle (Intelligence at endpoints, simplicity in core routers).`,

      definitions: [
        {
          term: 'TCP/IP Protocol Suite',
          definition: 'A four-layer hierarchical protocol suite that powers the global Internet, defining how data should be packetized, addressed, transmitted, routed, and received.',
          keyPoints: ['4 core layers', 'Implementation standard', 'Designed by Vint Cerf & Bob Kahn']
        },
        {
          term: 'End-to-End Principle',
          definition: 'A fundamental network architectural rule stating that application-specific functions and reliability should reside at communication endpoints rather than in intermediate network nodes.',
          keyPoints: ['Core routers only forward IP packets', 'TCP endpoints handle retransmissions']
        }
      ],

      examples: [
        {
          title: 'DNS Resolution and HTTP Web Page Fetching',
          scenario: 'A browser requests shikshasahayak.org by first resolving its domain name and then fetching the home page HTML.',
          explanation: '1. DNS uses UDP at the Transport layer for fast, single-packet lookup without handshake overhead. 2. Once IP is resolved, HTTP uses TCP at the Transport layer with a 3-way handshake for guaranteed, in-order HTML delivery.'
        }
      ],

      mcqs: [
        {
          question: 'Which OSI layers are combined into the Application Layer of the TCP/IP 4-layer model?',
          options: [
            'Network, Data Link, and Physical',
            'Session, Presentation, and Application',
            'Transport, Session, and Presentation',
            'Data Link and Physical only'
          ],
          answer: 1,
          explanation: 'In the TCP/IP model, the functionality of the Session, Presentation, and Application layers of the OSI model are consolidated into a single Application layer.'
        },
        {
          question: 'What type of service is provided by the Internet Layer (IP) in the TCP/IP suite?',
          options: [
            'Connection-oriented reliable service',
            'Connectionless best-effort service',
            'Virtual circuit guaranteed service',
            'Acknowledged connectionless service'
          ],
          answer: 1,
          explanation: 'The Internet Protocol (IP) provides connectionless, best-effort packet delivery. It does not guarantee delivery, ordering, or duplicate protection; those duties belong to TCP.'
        },
        {
          question: 'Which protocol is responsible for resolving a logical 32-bit IP address into a 48-bit physical MAC address on a local area network?',
          options: ['DNS', 'DHCP', 'ARP', 'ICMP'],
          answer: 2,
          explanation: 'Address Resolution Protocol (ARP) dynamically resolves known IPv4 addresses to local physical MAC addresses.'
        },
        {
          question: 'Why was the TCP/IP model adopted over the OSI model for the global Internet?',
          answer: 1,
          options: [
            'OSI protocols were too simple to implement in hardware.',
            'TCP/IP protocols were already implemented, tested, and freely distributed with BSD Unix before OSI was standardized.',
            'TCP/IP required 7 layers while OSI only had 4.',
            'OSI model did not support packet switching.'
          ],
          explanation: 'TCP/IP gained market dominance because working code was integrated into BSD Unix and deployed on ARPANET before OSI standards were finalized.'
        }
      ],

      shortQuestions: [
        {
          question: 'State three key differences between TCP and UDP at the Transport Layer.',
          answer: '1. **Reliability**: TCP provides reliable, acknowledged data transfer with retransmissions; UDP provides unreliable best-effort datagram delivery.\n2. **Connection**: TCP is connection-oriented (3-way handshake); UDP is connectionless.\n3. **Overhead & Speed**: TCP has a larger header (20–60 bytes) with flow/congestion control; UDP has a lightweight 8-byte header and lower latency.',
          marks: 3
        },
        {
          question: 'Why does the TCP/IP model not include separate Session and Presentation layers?',
          answer: 'The architects of TCP/IP believed that session synchronization and data representation (formatting, encryption, compression) are application-specific needs best handled directly inside application libraries (e.g. OpenSSL, HTTP headers) rather than by the underlying operating system network stack.',
          marks: 3
        }
      ],

      longQuestions: [
        {
          question: 'Critically compare the OSI Reference Model and the TCP/IP Protocol Suite. Explain why OSI remains valuable despite TCP/IP being the real-world standard.',
          answer: `### Detailed Comparison:
1. **Layer Structure**: OSI has 7 distinct layers with strict boundaries; TCP/IP has 4 practical layers.
2. **Design Approach**: OSI is protocol-independent (designed before protocols); TCP/IP was protocol-driven (designed to describe working protocols).
3. **Session & Presentation**: OSI separates these into L5 and L6; TCP/IP incorporates them into L4 application libraries.
4. **Network Service Model**: OSI supports both connection-oriented and connectionless services in the network layer; TCP/IP strictly implements connectionless best-effort delivery at the Internet layer (IP).

### Why OSI Remains Crucial:
Although TCP/IP powers the commercial Internet, the OSI reference model remains the universal terminology and conceptual benchmark for computer engineering. It provides precise separation between services, interfaces, and protocols, which helps engineers troubleshoot network layers systematically.`,
          keyPoints: [
            'Side-by-side architectural diagram (7 layers vs 4 layers)',
            'Tabular comparison covering 6+ technical dimensions',
            'Analysis of protocol independence vs implementation dominance',
            'Justification of OSI educational and diagnostic value'
          ],
          marks: 7
        }
      ],

      vivaQuestions: [
        {
          question: 'What is the default header size of an IPv4 packet and a TCP segment without options?',
          answer: 'Both minimum IPv4 header and minimum TCP header are 20 bytes each (total minimum 40 bytes overhead per TCP/IP packet).'
        },
        {
          question: 'Which protocol is used by the "ping" command and at which layer does it operate?',
          answer: 'The ping command uses ICMP (Internet Control Message Protocol), which operates at the Internet Layer (Layer 2 of TCP/IP / Layer 3 of OSI).'
        }
      ],

      quickRevision: {
        summaryPoints: [
          'TCP/IP 4 layers: Application (L5-L7), Transport (L4), Internet (L3), Network Access (L1-L2).',
          'IP provides unreliable connectionless packet routing; TCP provides reliable connection-oriented byte streams.',
          'TCP header is 20-60 bytes; UDP header is 8 bytes.'
        ],
        formulas: [
          'Total Packet Overhead = IP Header (20B) + TCP Header (20B) + Ethernet Header & FCS (18B) = 58 Bytes',
          'Payload Efficiency = Data Size / (Data Size + Total Overhead)'
        ],
        commonMistakes: [
          'Thinking TCP/IP has 7 layers.',
          'Confusing ARP (Layer 2/3 bridge) with DNS (Layer 7 application).',
          'Believing that IP guarantees packet delivery without TCP.'
        ]
      }
    }
  },

  // --------------------------------------------------------------------------
  // TOPIC 3: Network Topologies (Bus, Star, Ring, Mesh, Hybrid)
  // --------------------------------------------------------------------------
  {
    params: {
      university: 'gtu',
      branch: 'branch_computer',
      semester: 5,
      subject: 'Computer Networks',
      unitNo: 1,
      unitTitle: 'Introduction to Computer Networks & Physical Layer',
      topic: 'Network Topologies (Bus, Star, Ring, Mesh, Hybrid)',
      contentTypes: [
        'detailed_notes', 'short_notes', 'definitions', 'examples', 'mcqs',
        'short_questions', 'long_questions', 'numerical_problems', 'viva_questions', 'quick_revision'
      ]
    },
    payload: {
      topic: 'Network Topologies (Bus, Star, Ring, Mesh, Hybrid)',
      detailedNotes: `### 1. Introduction to Network Topology
**Network Topology** refers to the schematic arrangement of nodes (computers, printers, switches) and connecting lines (links) in a computer network. Topology can be categorized into:
1. **Physical Topology**: The actual physical layout of cables, devices, and hardware.
2. **Logical Topology**: The logical path that data signals follow across the physical layout (e.g. Physical Star with Logical Bus in Ethernet hubs).

---

### 2. The 5 Core Physical Topologies

\`\`\`
  Mesh Topology              Star Topology             Bus Topology
    Node---Node                Node   Node               |---|---|---|---|
    | \\ X / |                    \\   /                   |   |   |   |
    Node---Node                 [Switch]                [N] [N] [N] [N]
    | / X \\ |                    /   \\                 (Terminator at ends)
    Node---Node                Node   Node
\`\`\`

#### 1. Mesh Topology
- **Structure**: Every node has a dedicated point-to-point link to every other node in the network.
- **Formulas for Fully Connected Mesh ($N$ Nodes)**:
  - **Total Links**: 
    $$L = \\frac{N(N - 1)}{2}$$
  - **I/O Ports per Node**: 
    $$\\text{Ports} = N - 1$$
- **Advantages**:
  - High fault tolerance and reliability; failure of one link does not affect others.
  - Dedicated traffic prevents bottlenecking.
  - Maximum security and privacy (point-to-point link).
- **Disadvantages**:
  - Extremely high cabling cost and complex installation.
  - Requires large number of I/O ports per device.
- **Use Cases**: WAN core backbones, nuclear control networks, mission-critical avionics.

#### 2. Star Topology
- **Structure**: Every node is connected directly to a central controller (Hub or Switch) via a point-to-point link. Nodes do not communicate directly with each other.
- **Links Required**: $L = N$ links.
- **Advantages**:
  - Easy to install, configure, and modify.
  - Simple fault identification and isolation; if one cable fails, only that node is disconnected.
  - No disruption to the network when adding or removing devices.
- **Disadvantages**:
  - **Single Point of Failure**: If the central switch/hub fails, the entire network collapses.
  - Requires more cable than bus topology.
- **Use Cases**: Modern LANs (Office networks, Home Wi-Fi/Ethernet setups).

#### 3. Bus Topology
- **Structure**: All devices are connected to a single central backbone cable (bus) with drop lines and taps. **Terminators** are attached at both ends to absorb signals and prevent reflection.
- **Advantages**:
  - Inexpensive and uses minimal cabling.
  - Easy to connect a small number of computers.
- **Disadvantages**:
  - Heavy signal reflection and collisions under load.
  - If the main backbone cable breaks, the entire network goes down.
  - Difficult fault diagnosis and isolation.
- **Use Cases**: Early 10BASE2/10BASE5 coaxial Ethernet networks.

#### 4. Ring Topology
- **Structure**: Each node is connected to exactly two adjacent nodes, forming a continuous circular loop. Data travels in a single direction (unidirectional) using **Token Ring** arbitration.
- **Advantages**:
  - Equal access to media for all nodes; no collisions because token passing manages transmission.
- **Disadvantages**:
  - A break in the ring disables the entire network unless a dual-ring (FDDI) architecture is used.
  - High latency as packets must travel through every intermediate node.
- **Use Cases**: Fiber Distributed Data Interface (FDDI), SONET rings in telecom.

#### 5. Hybrid & Tree Topology
- **Structure**: Combines two or more distinct topologies (e.g. Star-Bus, Star-Ring). **Tree topology** is a hierarchical star arrangement with root nodes and branching secondary switches.
- **Advantages**: Scalable, highly flexible, robust hierarchy.
- **Disadvantages**: Complex design and maintenance.
- **Use Cases**: Enterprise campus networks, university networks.`,

      shortNotes: `• **Topology**: Physical layout (cabling) vs Logical layout (signal flow).
• **Mesh**: Fully connected. $L = \\frac{N(N-1)}{2}$ links. Highest redundancy, highest cost.
• **Star**: Connected to central switch. $L = N$ links. Central point of failure. Dominates modern LANs.
• **Bus**: Shared backbone with terminators. Backbone failure brings down whole network.
• **Ring**: Circular loop. Token passing. One break stops ring unless dual-ring is used.
• **Tree / Hybrid**: Hierarchical combination of Star and Bus for large-scale enterprise campus networks.`,

      definitions: [
        {
          term: 'Network Topology',
          definition: 'The geometric and physical arrangement of nodes, connecting cables, and communication links within a computer network.',
          keyPoints: ['Physical vs Logical', 'Defines data flow path and fault domains']
        },
        {
          term: 'Single Point of Failure (SPOF)',
          definition: 'A central component or link whose failure immediately results in the complete failure of the entire networking system (e.g. central switch in Star topology).',
          keyPoints: ['Mitigated by Mesh/Redundancy', 'Crucial design parameter in LANs']
        }
      ],

      examples: [
        {
          title: 'Campus Network Setup (Tree / Star-Bus Hybrid)',
          scenario: 'A university campus connects 5 engineering departments to a central data center.',
          explanation: 'Each departmental lab uses a Star topology with a departmental switch. All departmental switches are connected via high-speed optical fiber backbone in a Tree topology to the Core Layer-3 switch in the university data center.'
        }
      ],

      mcqs: [
        {
          question: 'How many physical duplex links are required to fully connect a Mesh topology network of 10 computers?',
          options: ['10 links', '45 links', '90 links', '20 links'],
          answer: 1,
          explanation: 'In a fully connected mesh network, total links $L = \\frac{N(N-1)}{2} = \\frac{10(9)}{2} = 45$ links.'
        },
        {
          question: 'What is the primary function of terminators at both ends of a Bus topology backbone cable?',
          options: [
            'To boost signal strength for distant nodes',
            'To prevent signal reflection and interference',
            'To assign IP addresses to nodes',
            'To act as a central switch'
          ],
          answer: 1,
          explanation: 'Terminators absorb the electrical signal when it reaches the physical end of the cable, preventing reflection back into the line which causes collisions.'
        },
        {
          question: 'Which topology exhibits a Single Point of Failure at its central hub or switch?',
          options: ['Mesh Topology', 'Star Topology', 'Ring Topology', 'Fully Connected Topology'],
          answer: 1,
          explanation: 'In a Star topology, all communication passes through the central switch; if this device fails, the entire network fails.'
        },
        {
          question: 'Which network topology is used by FDDI (Fiber Distributed Data Interface) for fault tolerance?',
          options: ['Single Star Topology', 'Dual Ring Topology', 'Bus Topology', 'Point-to-Point Line'],
          answer: 1,
          explanation: 'FDDI uses two counter-rotating rings (Dual Ring). If the primary ring fails, traffic automatically loops back onto the secondary ring.'
        }
      ],

      shortQuestions: [
        {
          question: 'Explain the difference between Physical Topology and Logical Topology with an example.',
          answer: 'Physical Topology is the physical arrangement of hardware and cables (e.g. computers wired into a central Ethernet hub forming a physical Star). Logical Topology is how data signals travel between devices (e.g. the hub broadcasts incoming signals to all ports simultaneously, operating as a logical Bus).',
          marks: 3
        },
        {
          question: 'Why is a fully connected Mesh topology rarely used in large commercial LANs?',
          answer: 'In a network with $N$ nodes, a fully connected mesh requires $\\frac{N(N-1)}{2}$ links and $N-1$ I/O ports per device. For 100 computers, this would require 4,950 cables and 99 ports per computer, making installation, cabling, and port costs prohibitively high.',
          marks: 3
        }
      ],

      longQuestions: [
        {
          question: 'Compare Mesh, Star, Bus, and Ring topologies based on: (1) Cabling Cost, (2) Fault Tolerance, (3) Ease of Installation, (4) Scalability, and (5) Failure Impact.',
          answer: `### Comprehensive Comparison of Topologies:

| Topology | Cabling Cost | Fault Tolerance | Installation | Scalability | Impact of Cable Failure |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mesh** | Very High ($\\approx N^2/2$) | **Highest** (No single failure affects other links) | Complex | Poor (Requires $N-1$ ports) | Only the single connected pair is affected |
| **Star** | Moderate ($N$ links) | High for node lines; **Zero** for central switch | **Easiest** | **High** (Plug-and-play into switch) | Node line failure isolates 1 node; switch failure crashes all |
| **Bus** | **Lowest** (1 backbone) | Poor | Moderate | Poor (Adds load/collisions) | Backbone break halts entire network |
| **Ring** | Low-Moderate ($N$ links) | Poor (Single ring) / High (Dual ring) | Moderate | Moderate | Single ring break stops all communication |

**Conclusion**: Star topology remains the standard choice for LANs due to optimal balance between cabling cost, ease of troubleshooting, and high scalability.`,
          keyPoints: [
            'Neat schematic diagrams for Mesh, Star, Bus, Ring',
            '5-parameter tabular comparison matrix',
            'Mathematical link formula for Mesh vs Star',
            'Explanation of why Star topology dominates modern LANs'
          ],
          marks: 7
        }
      ],

      numericalProblems: [
        {
          problem: 'A newly established IT lab needs to connect 16 high-performance workstations. Calculate: (a) The number of duplex physical cables required if a fully connected Mesh topology is implemented. (b) The number of cables required if a Star topology is used. (c) How many additional cables are required for Mesh if 4 more computers are added to the lab?',
          givenData: '• Initial Nodes ($N_1$) = 16\n• Expanded Nodes ($N_2$) = 20',
          formulaUsed: `1. Mesh Links: $L_{mesh} = \\frac{N(N - 1)}{2}$
2. Star Links: $L_{star} = N$`,
          steps: [
            'Step 1: Calculate initial Mesh links for $N = 16$:\n$$L_{mesh1} = \\frac{16 \\times 15}{2} = 120\\text{ cables}$$',
            'Step 2: Calculate initial Star links for $N = 16$:\n$$L_{star1} = 16\\text{ cables}$$',
            'Step 3: Calculate expanded Mesh links for $N = 20$:\n$$L_{mesh2} = \\frac{20 \\times 19}{2} = 190\\text{ cables}$$',
            'Step 4: Calculate additional cables required for Mesh:\n$$\\Delta L = 190 - 120 = 70\\text{ additional cables}$$'
          ],
          finalAnswer: 'Initial Mesh = 120 cables, Initial Star = 16 cables, Additional Mesh cables for 4 new nodes = 70 cables'
        }
      ],

      vivaQuestions: [
        {
          question: 'What is a Tree topology and why is it preferred in campus networks?',
          answer: 'A Tree topology is a hierarchical combination of multiple Star networks connected to a central root switch. It enables modular expansion, segmented broadcast domains, and departmental isolation.'
        },
        {
          question: 'If one computer in a Star topology has a broken cable, does it disrupt the communication of other computers?',
          answer: 'No. In a Star topology, each node has an independent point-to-point link to the central switch. The failure of one cable only disconnects that specific workstation.'
        }
      ],

      quickRevision: {
        summaryPoints: [
          'Mesh has $N(N-1)/2$ links, highest fault tolerance, used in WAN core.',
          'Star has $N$ links, easy fault isolation, dominated by central switch SPOF.',
          'Bus uses single backbone cable with terminators; Ring uses token passing loop.'
        ],
        formulas: [
          'Mesh Links = N(N - 1) / 2',
          'Mesh Ports per Node = N - 1',
          'Star Links = N'
        ],
        commonMistakes: [
          'Forgetting the division by 2 in the Mesh link formula.',
          'Thinking that Ethernet switches create a physical bus topology.'
        ]
      }
    }
  },

  // --------------------------------------------------------------------------
  // TOPIC 4: Transmission Media (Guided vs Unguided Media)
  // --------------------------------------------------------------------------
  {
    params: {
      university: 'gtu',
      branch: 'branch_computer',
      semester: 5,
      subject: 'Computer Networks',
      unitNo: 1,
      unitTitle: 'Introduction to Computer Networks & Physical Layer',
      topic: 'Transmission Media (Guided vs Unguided Media)',
      contentTypes: [
        'detailed_notes', 'short_notes', 'definitions', 'examples', 'mcqs',
        'short_questions', 'long_questions', 'viva_questions', 'quick_revision'
      ]
    },
    payload: {
      topic: 'Transmission Media (Guided vs Unguided Media)',
      detailedNotes: `### 1. Introduction to Transmission Media
**Transmission Media** is the physical communication path located at **Layer 1 (Physical Layer)** of the OSI model through which electromagnetic signals (data bits) travel from sender to receiver.

Transmission media is classified into two primary categories:
1. **Guided Media (Bounded / Wired)**: Solid physical conductors constrain and guide the signal along a specific path (copper or optical fiber).
2. **Unguided Media (Unbounded / Wireless)**: Electromagnetic waves propagate through air, water, or vacuum without physical confinement.

---

### 2. Guided Media (Wired)

#### A. Twisted Pair Cable
- **Structure**: Pairs of insulated copper wires twisted spirally together.
- **Why Twisting?**: Twisting ensures both wires are equally exposed to external Electromagnetic Interference (EMI) and crosstalk. Differential signaling cancels out the induced noise at the receiver.
- **Types**:
  1. **Unshielded Twisted Pair (UTP)**: Most common for LANs (Cat5e, Cat6, Cat6a). Inexpensive, flexible.
  2. **Shielded Twisted Pair (STP)**: Metal foil shielding covers each pair to prevent high industrial noise.
- **Connectors**: RJ-45 (8 pins). Max distance without repeater: 100 meters.

#### B. Coaxial Cable
- **Structure**: Solid central copper conductor surrounded by dielectric insulation, outer braided metallic shield, and plastic jacket.
- **Advantages**: Higher bandwidth and noise immunity than twisted pair; lower attenuation over longer distances.
- **Types**: 50-ohm (digital Ethernet baseband - 10BASE2/10BASE5) and 75-ohm (analog broadband cable TV).
- **Connectors**: BNC connector, BNC T-connector, BNC terminator.

#### C. Optical Fiber Cable (OFC)
- **Principle of Operation**: Uses light pulses to transmit data based on **Total Internal Reflection (TIR)**. Light ray enters the inner glass **Core** ($n_1$) at an angle greater than the critical angle, reflecting off the outer glass **Cladding** ($n_2$), where $n_1 > n_2$.
- **Key Advantages**:
  - **Immense Bandwidth**: Supports Terabits per second.
  - **Zero EMI**: Immune to electromagnetic interference and electrical surges.
  - **Low Attenuation**: Can travel tens of kilometers without repeaters.
  - **Security**: Extremely difficult to tap without breaking the signal.
- **Types**:
  - **Single-Mode Fiber (SMF)**: Tiny core ($\approx 9\\,\\mu\\text{m}$), uses laser, long-haul telecom.
  - **Multi-Mode Fiber (MMF)**: Larger core ($50–62.5\\,\\mu\\text{m}$), uses LED, campus/LAN backbones.

---

### 3. Unguided Media (Wireless)

| Wireless Type | Frequency Range | Propagation Mode | Key Applications |
| :--- | :--- | :--- | :--- |
| **Radio Waves** | 3 kHz – 1 GHz | Omnidirectional (travels in all directions, penetrates walls) | FM Radio, AM Radio, Television, Cordless phones |
| **Microwaves** | 1 GHz – 300 GHz | Unidirectional / Line-of-sight (requires aligned parabolic antennas) | Satellite communication, Cellular 4G/5G, Wi-Fi, Radar |
| **Infrared** | 300 GHz – 400 THz | Short-range Line-of-sight (cannot penetrate solid walls) | TV remotes, IrDA peripheral links, secure indoor sensors |`,

      shortNotes: `• **Transmission Media**: Physical Layer path for signal propagation.
• **Guided (Wired)**:
  - Twisted Pair: Twisting cancels EMI/crosstalk. UTP (cheap, 100m max) vs STP (shielded). RJ-45.
  - Coaxial: Solid core + dielectric + braided shield. BNC connector.
  - Optical Fiber: Uses Total Internal Reflection ($n_{core} > n_{cladding}$). Immune to EMI, high bandwidth, low attenuation. SMF (laser, long-haul) vs MMF (LED, LAN).
• **Unguided (Wireless)**:
  - Radio Waves (3 kHz - 1 GHz): Omnidirectional, penetrates walls.
  - Microwaves (1 GHz - 300 GHz): Line-of-sight, directional parabolic dishes, satellite links.
  - Infrared (300 GHz - 400 THz): Short range, cannot penetrate walls (high security for remotes).`,

      definitions: [
        {
          term: 'Guided Transmission Media',
          definition: 'Physical communication channels where electromagnetic signals are physically bounded and guided inside a physical medium such as copper wire or optical fiber.',
          keyPoints: ['Twisted Pair, Coaxial, Optical Fiber', 'High data security', 'Bounded bandwidth']
        },
        {
          term: 'Total Internal Reflection (TIR)',
          definition: 'The optical phenomenon where light traveling in an optically denser medium (core) reflects completely back into the medium when striking the boundary of a rarer medium (cladding) at an angle greater than the critical angle.',
          keyPoints: ['Condition: $n_{core} > n_{cladding}$', 'Core mechanism of fiber optic transmission']
        }
      ],

      examples: [
        {
          title: 'Subsea Intercontinental Internet Cables',
          scenario: 'How data transfers across the Atlantic Ocean between European and North American data centers.',
          explanation: 'Subsea communication cables use armored Single-Mode Optical Fiber pairs with optical erbium-doped fiber amplifiers placed every 50–100 km, carrying tens of Terabits per second across thousands of kilometers under the ocean with near-zero latency degradation.'
        }
      ],

      mcqs: [
        {
          question: 'What is the primary scientific principle behind light transmission inside an optical fiber cable?',
          options: [
            'Electromagnetic Induction',
            'Total Internal Reflection',
            'Photoelectric Effect',
            'Diffraction and Polarization'
          ],
          answer: 1,
          explanation: 'Optical fiber guides light through Total Internal Reflection (TIR), which occurs because the refractive index of the core ($n_1$) is higher than the refractive index of the cladding ($n_2$).'
        },
        {
          question: 'Why are copper wires twisted around each other in Twisted Pair cables?',
          options: [
            'To make the cable stronger and more flexible',
            'To reduce electromagnetic interference (EMI) and crosstalk',
            'To increase the physical length of the copper conductor',
            'To increase electrical resistance'
          ],
          answer: 1,
          explanation: 'Twisting ensures external electromagnetic noise affects both wires equally, allowing differential receivers to cancel out common-mode noise.'
        },
        {
          question: 'Which type of unguided wireless transmission cannot penetrate solid walls, providing high indoor security?',
          options: ['Radio Waves', 'Microwaves', 'Infrared Waves', 'Satellite Signals'],
          answer: 2,
          explanation: 'Infrared waves have high frequencies (300 GHz – 400 THz) and cannot penetrate solid walls, preventing eavesdropping outside the room.'
        },
        {
          question: 'What is the standard maximum cable run distance for UTP Cat6 Ethernet without a repeater or switch?',
          options: ['50 meters', '100 meters', '500 meters', '1000 meters'],
          answer: 1,
          explanation: 'The standard maximum channel length for standard Ethernet over UTP (Cat5e/Cat6) is 100 meters (90m horizontal solid core cable + 10m patch cables).'
        }
      ],

      shortQuestions: [
        {
          question: 'Compare Single-Mode Fiber (SMF) and Multi-Mode Fiber (MMF).',
          answer: '1. **Core Diameter**: SMF has a very narrow core (8–10 $\\mu$m); MMF has a larger core (50–62.5 $\\mu$m).\n2. **Light Source**: SMF uses precise Laser diodes; MMF uses less expensive LEDs.\n3. **Distance**: SMF supports long-distance telecom (up to 50+ km without repeaters); MMF is limited to short distances (300–500 m) due to modal dispersion.',
          marks: 3
        },
        {
          question: 'Why is Optical Fiber immune to Electromagnetic Interference (EMI)?',
          answer: 'Optical fiber transmits information using dielectric light pulses (photons) through glass rather than electrical currents through metallic copper. Since glass does not conduct electricity, it is completely impervious to external magnetic fields, high-voltage lines, and lightning surges.',
          marks: 3
        }
      ],

      longQuestions: [
        {
          question: 'Explain the construction, working principle, advantages, and disadvantages of Optical Fiber Cable. Compare it with Twisted Pair Cable.',
          answer: `### 1. Construction of Optical Fiber:
- **Core**: Ultra-pure silica glass carrying light signals with refractive index $n_1$.
- **Cladding**: Glass layer with lower refractive index $n_2$ ($n_1 > n_2$).
- **Buffer Coating & Outer Jacket**: Protective silicone and Kevlar layer for mechanical tensile strength.

### 2. Working Principle: Total Internal Reflection (TIR):
Light injected into the core at an incident angle $\\theta_i > \\theta_c$ (Critical Angle) reflects repeatedly along the inner core-cladding boundary without escaping.

### 3. Comparison with Twisted Pair Cable:

| Parameter | Twisted Pair Cable | Optical Fiber Cable |
| :--- | :--- | :--- |
| **Transmission Medium** | Copper wire (Electrical electrons) | Glass / Plastic fiber (Photons / Light) |
| **Bandwidth** | Moderate (Up to 10 Gbps) | **Extremely High** (100+ Gbps to Terabits) |
| **EMI Immunity** | Susceptible to EMI and crosstalk | **100% Immune to EMI** |
| **Maximum Distance** | 100 meters | **50+ Kilometers** |
| **Installation Cost** | Low and easy to terminate | Higher termination and splicing equipment cost |`,
          keyPoints: [
            'Labeled cross-sectional diagram of Optical Fiber (Core, Cladding, Buffer, Jacket)',
            'Mathematical condition for Total Internal Reflection ($n_1 > n_2$ and $\\theta > \\theta_c$)',
            'Detailed 5-point comparison table with Twisted Pair cable',
            'Clear analysis of single-mode vs multi-mode fiber'
          ],
          marks: 7
        }
      ],

      vivaQuestions: [
        {
          question: 'What is the critical angle in optical fiber transmission?',
          answer: 'The critical angle $\\theta_c$ is the minimum angle of incidence at which light traveling in the denser core reflects along the boundary rather than refracting into the cladding. For angles greater than $\\theta_c$, total internal reflection occurs: $\\sin(\\theta_c) = \\frac{n_2}{n_1}$.'
        },
        {
          question: 'What is crosstalk in copper communication cables?',
          answer: 'Crosstalk is unwanted electromagnetic coupling between adjacent wire pairs where signal energy in one wire induces interference in an adjacent wire.'
        }
      ],

      quickRevision: {
        summaryPoints: [
          'Guided media: Twisted Pair (RJ-45, 100m), Coaxial (BNC), Optical Fiber (Total Internal Reflection).',
          'Unguided media: Radio waves (omnidirectional), Microwaves (line-of-sight), Infrared (line-of-sight, no wall penetration).',
          'In Optical Fiber: $n_{core} > n_{cladding}$ is mandatory for Total Internal Reflection.'
        ],
        formulas: [
          'Critical Angle: $\\sin(\\theta_c) = \\frac{n_{cladding}}{n_{core}}$',
          'Refractive Index: $n = \\frac{c}{v}$'
        ],
        commonMistakes: [
          'Assuming optical fiber conducts electrical signals instead of light.',
          'Thinking unshielded twisted pair (UTP) can run for 500 meters without repeaters.',
          'Confusing radio wave omnidirectional propagation with microwave line-of-sight.'
        ]
      }
    }
  }
];

// --------------------------------------------------------------------------
// Validation & Batch Serialization Runner
// --------------------------------------------------------------------------
console.log('================================================================');
console.log('SHIKSHA SAHAYAK — PHASE 3 REAL CONTENT PILOT GENERATOR');
console.log('GTU Computer Engineering Sem 5 — Computer Networks (Unit 1)');
console.log('================================================================\n');

let totalIssues = 0;
let totalFlags = 0;
const importBatchPayload: any[] = [];

PILOT_TOPICS.forEach((item, index) => {
  console.log(`\n--- Validating Topic ${index + 1}: ${item.payload.topic} ---`);
  
  const validation = validateGeneratedContent(item.payload, item.params);
  const markdown = formatPayloadToMarkdown(item.payload, item.params);

  console.log(`• Status: [${validation.status.toUpperCase()}]`);
  console.log(`• Issues Found: ${validation.issues.length}`);
  console.log(`• Quality Review Flags: ${validation.qualityReviewFlags.length}`);
  if (validation.qualityReviewFlags.length > 0) {
    validation.qualityReviewFlags.forEach(f => console.log(`  ⚠ ${f}`));
  }
  console.log(`• Formatted Markdown Length: ${markdown.length} characters`);

  totalIssues += validation.issues.length;
  totalFlags += validation.qualityReviewFlags.length;

  importBatchPayload.push({
    university: item.params.university,
    branch: item.params.branch,
    semester: item.params.semester,
    subject: item.params.subject,
    unit: item.params.unitNo,
    unit_title: item.params.unitTitle,
    topic: item.payload.topic,
    difficulty: 'medium',
    payload: item.payload,
    raw_markdown: markdown
  });
});

console.log('\n================================================================');
console.log(`PILOT VALIDATION SUMMARY:`);
console.log(`• Topics Processed: ${PILOT_TOPICS.length}`);
console.log(`• Total Structural Issues: ${totalIssues}`);
console.log(`• Total Quality Review Flags: ${totalFlags}`);
console.log('================================================================\n');

// Save the batch payload to scratch artifact directory for ingestion
const scratchDir = 'C:/Users/ayush/.gemini/antigravity-ide/brain/9eeb7749-d707-418d-a42e-cd3fa9a46018/scratch';
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

const batchFilePath = path.join(scratchDir, 'pilot_cn_unit1_batch.json');
fs.writeFileSync(batchFilePath, JSON.stringify(importBatchPayload, null, 2), 'utf-8');
console.log(`✅ Staged Pilot Batch JSON to: ${batchFilePath}`);

if (totalIssues > 0) {
  console.error('❌ Structural validation errors detected in pilot generation.');
  process.exit(1);
} else {
  console.log('✅ ALL 4 PILOT TOPICS PASSED STRUCTURAL VALIDATION WITH ZERO ERRORS.');
}
