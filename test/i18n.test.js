const t = require('tap')
const path = require('path')
const Fastify = require('fastify')
const { ERR_MISSING_DICTIONARY_FOR_DEFAULT_LOCALE } = require('../errors')

function buildFastify (t) {
  const fastify = Fastify({ logger: false })
  t.teardown(() => fastify.close())
  return fastify
}

t.test('fastify-polyglot', async t => {
  t.test('without options and missing default locales folder', async t => {
    t.plan(1)
    const fastify = buildFastify(t)
    try {
      await fastify.register(require('../i18n'))
      t.fail('should throw an error')
    } catch (err) {
      t.ok(err, 'should throw an error')
    }
  })

  t.test('with a not existing default locale', async t => {
    t.plan(2)
    const fastify = buildFastify(t)
    try {
      await fastify.register(require('../i18n'), {
        defaultLocale: 'jp'
      })
      t.fail('should throw an error')
    } catch (err) {
      t.ok(err, 'should throw an error')
      t.equal(err.message, ERR_MISSING_DICTIONARY_FOR_DEFAULT_LOCALE, 'should notify default locale is not present in locale dictionaries')
    }
  })

  t.test('with an existing locales folder', async t => {
    t.plan(1)
    const fastify = buildFastify(t)
    try {
      await fastify.register(require('../i18n'), {
        localesPath: path.join(__dirname, './locales')
      })
      const locales = Object.keys(fastify.i18n.locales)
      t.same(locales, ['en'], 'should load locales from fs')
    } catch (err) {
      console.error(err)
      t.error(err, 'should not throw any error')
    }
  })

  t.test('with a not existing locales folder', async t => {
    t.plan(1)
    const fastify = buildFastify(t)
    try {
      await fastify.register(require('../i18n'), {
        localesPath: path.join(__dirname, './li18n'),
        locales: {
          en: {
            world: 'World'
          }
        }
      })
      const locales = Object.keys(fastify.i18n.locales)
      t.same(locales, ['en'], 'should use only provided locales without failing')
    } catch (err) {
      console.error(err)
      t.error(err, 'should not throw any error')
    }
  })

  t.test('with locales from both local and provided dictionaries', async t => {
    t.plan(1)
    const fastify = buildFastify(t)
    try {
      await fastify.register(require('../i18n'), {
        localesPath: path.join(__dirname, './locales'),
        locales: {
          it: {
            hi: 'Ciao'
          }
        }
      })
      const locales = Object.keys(fastify.i18n.locales).sort()
      t.same(locales, ['en', 'it'], 'should merge locales')
    } catch (err) {
      console.log(err)
      t.error(err, 'should not throw any error')
    }
  })

  t.test('with locales from both local and provided dictionaries with the same locale code', async t => {
    t.plan(1)
    const fastify = buildFastify(t)
    try {
      await fastify.register(require('../i18n'), {
        localesPath: path.join(__dirname, './locales'),
        locales: {
          en: {
            world: 'World'
          }
        }
      })
      const keys = Object.keys(fastify.i18n.locales.en).sort()
      t.same(keys, ['hi', 'world'], 'should merge dictionaries')
    } catch (err) {
      console.log(err)
      t.error(err, 'should not throw any error')
    }
  })

  t.test('locale fallback functionality', async t => {
    t.plan(3);
    
    const fastify = buildFastify(t);
    
    try {
      await fastify.register(require('../i18n'), {
        localesPath: path.join(__dirname, './locales'),
        defaultLocale: 'en',
        locales: {
          en: {
            world: 'World'  // Ensure 'world' is defined in the English locale
          },
          it: {
            hi: 'Ciao'
          }
        }
      });
  
      // Check if translation works with the provided locale
      t.equal(fastify.i18n.t('hi', { locale: 'it' }), 'Ciao', 'should translate using locale it');
      
      // Check if fallback works when key is not present in the provided locale
      t.equal(fastify.i18n.t('nonexistent_key', { locale: 'it' }), 'nonexistent_key', 'should fall back to key if translation not found');
  
      // Check if fallback to default locale works
      t.equal(fastify.i18n.t('world'), 'World', 'should use default locale if key is missing in provided locales');
  
    } catch (err) {
      console.error(err);
      t.error(err, 'should not throw any error');
    }
  });
})

// Assertions explanation:

// Translation in Provided Locale: Check that the key 'hi' is correctly translated to 'Ciao' when the locale is set to 'it'.
// Fallback for Missing Key: Verify that if a key ('nonexistent_key') is not present in the specified locale ('it'), the key itself is returned (indicating no translation found).
// Fallback to Default Locale: Ensure that if a key ('world') is missing in the current locale, it falls back to the default locale ('en') and provides the correct translation ('World').